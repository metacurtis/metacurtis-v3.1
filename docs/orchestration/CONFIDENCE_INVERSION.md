# v3.7 Protocol Extension: Confidence-Grounding Inversion Principle

## Meta-Protocol Addition

This document extends the MetaCurtis Orchestration v3.7 protocol with a meta-rule governing when and how Agent F diagnostics must be invoked.

---

## The Problem

LLMs exhibit a failure mode where **high confidence correlates with increased error risk** in codebase-specific tasks:

```
High probability match to training data
        ↓
High confidence in solution
        ↓
Protocol feels unnecessary ("I know this pattern")
        ↓
Skip/shortcut F diagnostic
        ↓
Training-data assumption ≠ Repo truth
        ↓
Drift, bugs, branching failures
```

**The paradox:** The MORE confident the LLM is, the MORE likely it's pattern-matching against training data rather than your repo. Confidence is a signal that grounding is needed, not a signal that grounding can be skipped.

---

## The Principle

### Confidence-Grounding Inversion

> **LLM confidence in a solution approach is INVERSELY correlated with solution validity for repo-specific tasks.**

When an LLM expresses high confidence:
- It has found a strong pattern match in training data
- Training data patterns are exactly where repo-specific invariants (single-writer, ownership, custom initialization) are most likely to be violated
- The solution is "plausible but wrong" — architecturally valid for *a* codebase but incorrect for *this* codebase

---

## Protocol Rules

### Rule 1: Confidence Triggers Grounding

```
BROKEN HEURISTIC:
  Uncertain → Use F diagnostic
  Confident → Proceed directly

CORRECT HEURISTIC:
  Confident → DEFINITELY use F diagnostic (high pattern-match risk)
  Uncertain → Use F diagnostic (unknown territory)
```

**F diagnostic is mandatory regardless of confidence state.**

### Rule 2: Pattern Recognition is a Red Flag

When the orchestrating LLM recognizes a "common pattern" (React lifecycle, event handling, state machine, initialization guards, etc.), this is a SIGNAL that training-data assumptions are likely active.

**Action:** Immediately generate F diagnostic prompt. Do not proceed with implementation based on pattern recognition alone.

**Rationale:** Common patterns are exactly where your codebase likely diverges from training-data norms via custom invariants.

### Rule 3: Assumption Externalization

Before any implementation proposal, the orchestrating LLM must externalize assumptions:

```
ASSUMPTIONS I'M MAKING:
1. TheaterDirector listens to ENGINE_VIEWPORT_HINT
2. That listener is active when autostart is disabled
3. Demo intercept can happen in that handler

DIAGNOSTIC QUESTIONS FOR F:
1. Is assumption 1 true? (file, line numbers)
2. Is assumption 2 true? (conditional logic)
3. Is assumption 3 architecturally possible?
```

Each assumption becomes a falsifiable claim that F validates or refutes.

### Rule 4: F Output is Required Input

No architecture proposal without `F_diagnosticFacts`.  
No implementation spec without `F_validationResults`.  
No patches without `F_fileMapView` confirmation.

If the LLM produces a solution without citing F output, the solution is **invalid by definition** — not because it's wrong, but because it's ungrounded.

### Rule 5: Remove LLM Discretion

The LLM does not get to decide if F is necessary. The protocol decides. F runs. Always.

```
PROTOCOL GATE:
- Step requires F diagnostic → F runs
- LLM feels confident → F still runs
- Pattern seems obvious → F still runs
- Time pressure exists → F still runs (faster to ground than to debug)
```

---

## Integration with v3.7 Lane

### Modified Lane

```
F:contract-scan → F:diagnostic → A → [CONFIDENCE CHECK] → B → C → F:executor → F:contract-verify → D → E
```

### Confidence Check Gate

After Agent A produces spec, before Agent B analyzes:

```jsonc
{
  "step": 2.5,
  "label": "Confidence check",
  "phase": "validation",
  "agent": "F",
  "mode": "confidence-audit",
  "inputFrom": ["ArchitectSpec"],
  "checks": [
    "Does spec rely on pattern recognition?",
    "Are there unstated assumptions about architecture?",
    "Did A express high confidence without F grounding?"
  ],
  "action": "If any check fails, return to F:diagnostic with expanded scope",
  "outputAlias": "ConfidenceAudit"
}
```

### Flow File Extension

Add to flow file schema:

```jsonc
{
  "confidenceOverride": {
    "enabled": true,
    "triggerPhrases": [
      "I know how to solve this",
      "This is a common pattern",
      "This should work",
      "Based on how X typically works"
    ],
    "action": "halt_and_ground",
    "groundingAgent": "F",
    "groundingMode": "diagnostic"
  }
}
```

---

## Practical Implementation

### In Chat Sessions

When orchestrating with an LLM:

1. **Before proposing any solution**, ask: "What assumptions am I making about this codebase?"
2. **If the LLM expresses confidence**, immediately request F diagnostic
3. **If the LLM says \"this is a common pattern\"**, treat as red flag requiring validation
4. **After F returns**, THEN proceed with implementation

### In Automated Flows

Add confidence detection to the runner:

```javascript
// In run-flow-v3.7.mjs
function detectConfidenceSignals(agentOutput) {
  const signals = [
    /I know how to/i,
    /this is a common/i,
    /typically works/i,
    /should work/i,
    /based on my experience/i
  ];
  return signals.some(s => s.test(agentOutput));
}

// If detected, inject additional F diagnostic step
if (detectConfidenceSignals(stepOutput)) {
  console.warn('[CONFIDENCE SIGNAL DETECTED] Injecting F:diagnostic');
  // Insert F step before continuing
}
```

---

## Evidence from This Session

### What Happened

1. **Initial hypothesis** (high confidence): "Hook into TheaterDirector's ENGINE_VIEWPORT_HINT handler"
2. **F diagnostic revealed**: That listener is never installed when autostart is disabled
3. **Result without F**: Dead code, wasted patches, downstream bugs
4. **Result with F**: Correct intercept point identified before any code written

### Cost of Skipping F

| Path | Outcome |
|------|---------|
| Confidence → Code → Debug | 2-4 hours debugging to discover what F revealed in minutes |
| Confidence → F → Code | Correct implementation on first attempt |

### Bugs Prevented by F

- Silent failure (code in non-existent listener)
- Race condition (setTimeout vs event-driven initialization)
- Contract violations (missing required fields)
- Schema failures (unknown fields rejected)

---

## Related Patterns

- **ZAG-001: Zero-Assumption Grounding Diagnostic** — Full grounding template when confidence is high or patterns feel “obvious” (`docs/patterns/ZAG-001.md`).

---

## Summary

> Every AI coding tool has the confidence problem — they pattern-match against training data and produce plausible-but-wrong solutions. This protocol inverts the heuristic: confidence triggers validation, not bypass. The result is deterministic output from a probabilistic system.

**Core insight:** You're not just orchestrating agents. You're disciplining probability into determinism.
