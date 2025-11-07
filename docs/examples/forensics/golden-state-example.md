# Example: Golden State Capture Before Major Refactor

**Real scenario from MetaCurtis development**

---

## Situation

**Date:** January 10, 2025  
**Developer:** Curtis  
**Goal:** Refactor opening sequence controller to use state machine pattern  
**Risk:** High - Complex logic, easy to break  
**Strategy:** Capture golden state first, then refactor with confidence

---

## Pre-Refactor Golden State Capture

### T+0: Validate Current State
````bash
echo "=== FULL VALIDATION BEFORE REFACTOR ==="

# Layer 1: Constitutional
npm run validate-sst
# ✅ PASS

npm run detect-drift
# ✅ PASS

# Layer 2: Contracts
npm run test:contracts
# ✅ PASS (18/18 tests)

# Layer 4: Visual
npm run test:visual
# ✅ PASS (22/22 tests)

echo "✅ All validation passed - ready to capture golden state"
````

**Result:** System is in perfect state for refactor baseline.

---

### T+5 mins: Generate Evidence
````bash
npm run build-evidence

# Review evidence
cat reports/investigation-report-*.md | head -100
````

**Evidence shows:**
````markdown
## Opening Sequence Event Flow

### CHAOS_START
**Emitters:**
- theater/TheaterDirector.js:234
- theater/controllers/OpeningSequenceController.js:89

### COALESCE_START
**Emitters:**
- theater/controllers/OpeningSequenceController.js:156

### SETTLE_START
**Emitters:**
- theater/controllers/OpeningSequenceController.js:223

## Pattern Distribution

### OPENING_PHASE (8 occurrences)
- components/theater/OpeningSequence.jsx:67
- theater/controllers/OpeningSequenceController.js:45
- theater/controllers/OpeningSequenceController.js:123
- theater/controllers/OpeningSequenceController.js:198
````

**Key insight:** OpeningSequenceController has 3 phase emitters. This is what we're refactoring.

---

### T+8 mins: Capture Golden State
````bash
./scripts/git-forensics/capture-golden-state.sh
````

**Script output:**
````
🏆 Golden State Capture Protocol

=== VALIDATION PHASE ===

Layer 1: Constitutional...
✅ validate-sst passed
✅ detect-drift passed

Layer 2: Contracts...
✅ test:contracts passed (18/18)

Layer 4: Visual (optional)...
✅ test:visual passed (22/22)

✅ All validation passed!

=== EVIDENCE GENERATION ===

✅ Evidence generated

=== GOLDEN STATE CAPTURE ===

Evidence preserved: reports/opening-sequence-golden-20250110-091500.md
Metadata created: reports/opening-sequence-golden-20250110-091500.json

[main abc1234] docs: capture golden opening sequence state
 2 files changed, 245 insertions(+)
 create mode 100644 reports/opening-sequence-golden-20250110-091500.md
 create mode 100644 reports/opening-sequence-golden-20250110-091500.json

✅ GOLDEN STATE CAPTURED!

Tag: golden/opening-20250110-091500
Evidence: reports/opening-sequence-golden-20250110-091500.md

Next steps:
1. Push tag: ALLOW_PUSH=1 git push origin golden/opening-20250110-091500
2. Push commit: ALLOW_PUSH=1 git push origin main
````

---

### T+10 mins: Push Golden State
````bash
ALLOW_PUSH=1 git push origin golden/opening-20250110-091500
ALLOW_PUSH=1 git push origin main

# Verify remote has it
git ls-remote --tags origin | grep golden/opening-20250110-091500
# 7d3f52e96b8a1c4d refs/tags/golden/opening-20250110-091500
````

**Result:** Golden state safely on remote. Can restore from anywhere.

---

### T+15 mins: Document Golden State
````bash
cat > docs/GOLDEN_STATES.md << 'DOC'
# Golden States

## Current Golden States

### golden/opening-20250110-091500
**Date:** January 10, 2025  
**Purpose:** Pre-refactor baseline for opening sequence state machine  
**Status:** ✅ All validation passed  
**Evidence:** reports/opening-sequence-golden-20250110-091500.md

**Key Characteristics:**
- Event-driven opening controller
- 3 separate phase emitters
- 18/18 contract tests pass
- 22/22 visual tests pass
- Perfect SST compliance

**Use Cases:**
- Baseline for opening refactor
- Fallback if refactor breaks
- Comparison point for behavior changes

**To Restore:**
```bash
git checkout golden/opening-20250110-091500
npm install
npm run dev
```

**To Compare:**
```bash
git diff golden/opening-20250110-091500..HEAD
```
DOC

git add docs/GOLDEN_STATES.md
git commit -m "docs: document golden state golden/opening-20250110-091500"
git push origin main
````

---

## Refactor with Confidence

### T+20 mins: Start Refactor
````bash
# Create refactor branch FROM golden state
git checkout -b refactor/opening-state-machine golden/opening-20250110-091500

# Confirm starting from golden
git log -1 --oneline
# abc1234 docs: capture golden opening sequence state

# Now refactor with confidence - we can always restore
````

---

### T+30 mins - 3 hours: Implement State Machine
````javascript
// New state machine implementation
class OpeningStateMachine {
  constructor() {
    this.state = 'idle';
    this.transitions = {
      idle: { start: 'chaos' },
      chaos: { complete: 'coalesce' },
      coalesce: { complete: 'settle' },
      settle: { complete: 'finished' }
    };
  }
  
  transition(event) {
    const next = this.transitions[this.state]?.[event];
    if (next) {
      this.state = next;
      this.emit(`${next.toUpperCase()}_START`);
    }
  }
}
````

*[3 hours of refactoring...]*

---

### T+3h 30m: Test Refactored Version
````bash
npm run validate-sst
# ✅ PASS

npm run test:contracts
# ❌ FAIL - 2/18 tests failing
# "Opening sequence timeout"
# "Fencepost never arrives"

npm run dev
# Opening doesn't start at all!
````

**Problem:** Refactor broke something fundamental.

---

### T+3h 35m: Compare to Golden State
````bash
# Generate evidence for refactored version
npm run build-evidence
cp reports/investigation-report-*.md reports/refactor-broken.md

# Compare to golden
diff reports/opening-sequence-golden-20250110-091500.md reports/refactor-broken.md
````

**Evidence delta shows:**
````diff
- ### CHAOS_START
- **Emitters:**
- - theater/controllers/OpeningSequenceController.js:89
+ ### CHAOS_START
+ **Emitters:**
+ - (none)

- ### ENGINE_VIEWPORT_HINT
- **Listeners:**
- - theater/controllers/OpeningSequenceController.js:45
+ ### ENGINE_VIEWPORT_HINT
+ **Listeners:**
+ - (none)
````

**Discovery:** State machine isn't listening for ENGINE_VIEWPORT_HINT to start!

---

### T+3h 40m: Quick Fix
````javascript
// Add missing listener
class OpeningStateMachine {
  constructor() {
    this.state = 'idle';
    // ADD THIS:
    director.on('ENGINE_VIEWPORT_HINT', () => {
      if (this.state === 'idle') {
        this.transition('start');
      }
    });
  }
  // ... rest of class
}
````

---

### T+3h 45m: Re-test
````bash
npm run test:contracts
# ✅ PASS (18/18)

npm run dev
# ✅ Works! Opening sequence runs

# Generate evidence
npm run build-evidence

# Compare to golden
diff reports/opening-sequence-golden-20250110-091500.md reports/investigation-report-*.md
````

**Evidence delta now minimal:**
````diff
### CHAOS_START
**Emitters:**
-- theater/controllers/OpeningSequenceController.js:89
+- theater/controllers/OpeningStateMachine.js:23
````

**Result:** Refactor complete, behavior matches golden state!

---

## Results

**With Golden State Protection:** 3h 40m total, success with confidence.  
**Without Golden State:** 6-7h, likely rollback.

---

**Golden states enable aggressive refactoring with zero risk.**
