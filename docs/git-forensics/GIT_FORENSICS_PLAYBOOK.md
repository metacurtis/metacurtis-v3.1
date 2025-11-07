# Git Forensics Playbook v1.0

**Scientific debugging through systematic time-travel**

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [The Four Forensic Modes](#the-four-forensic-modes)
3. [Evidence-First Principle](#evidence-first-principle)
4. [Complete Workflows](#complete-workflows)
5. [Advanced Techniques](#advanced-techniques)
6. [Integration with AI (Claude-Kodex)](#integration-with-ai)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Philosophy

### Traditional Debugging
```
Bug reported → Guess at cause → Make changes → Test → Repeat
```
**Time:** 2-8 hours  
**Confidence:** Low  
**Knowledge captured:** None

### Git Forensics Debugging
```
Bug reported → Generate evidence → Bisect to find cause → 
Analyze with evidence → Surgical fix → Capture golden state
```
**Time:** 15-60 minutes  
**Confidence:** High  
**Knowledge captured:** Complete

### Core Principles

1. **Evidence Before Action**
   - Always generate evidence before debugging
   - Never guess when you can measure

2. **Scientific Method**
   - Hypothesis → Test → Analyze → Conclude
   - Git bisect automates hypothesis testing

3. **Preserve Knowledge**
   - Golden states capture working behavior
   - Evidence documents system topology
   - Commits tell the story

4. **Time as a Dimension**
   - Git history is your lab notebook
   - Every commit is a testable hypothesis
   - Bisect is binary search through time

---

## The Four Forensic Modes

### Mode 1: Evidence Generation (Passive)

**Use when:** Understanding current system state
```bash
# Generate complete evidence
npm run build-evidence

# Output:
# - reports/beatbus-map.json (event flow)
# - reports/source-hits.json (pattern distribution)
# - reports/sst-extract.json (configuration)
# - reports/investigation-report-*.md (master document)

# Time: 5 seconds
# Value: Complete system topology
```

**What you get:**
- Every event emitter → listener connection
- Every pattern occurrence with context
- Complete configuration state
- Interaction graph

---

### Mode 2: Forensic Exploration (Active)

**Use when:** Need to see how old versions behaved
```bash
# Safe exploration workflow
git checkout feature/current-work  # Your safe home

# Explore old commit
git checkout abc1234  # Detached HEAD (SAFE)
npm install
npm run dev
# Test manually, take notes

# Return home
git checkout feature/current-work

# Your current work is UNTOUCHED
```

**What you get:**
- See old behavior firsthand
- Compare multiple versions
- No risk to current work

---

### Mode 3: Automated Bisection (Scientific)

**Use when:** Know something broke, need to find when
```bash
# 1. Find good and bad commits
GOOD_COMMIT="golden/opening-20250106"  # Last known good
BAD_COMMIT="HEAD"                       # Current broken state

# 2. Start bisect
git bisect start
git bisect bad $BAD_COMMIT
git bisect good $GOOD_COMMIT

# 3. Run oracle (automated testing)
git bisect run ./scripts/git-forensics/oracle-opening.sh

# Git will:
# - Checkout midpoint commits
# - Run oracle (validates with your stack)
# - Mark good/bad based on oracle exit code
# - Binary search to find first bad commit

# 4. Result
# "abc1234 is the first bad commit"

# 5. Analyze
git show abc1234
./scripts/git-forensics/forensic-probe.sh abc1234

# Time: 5-15 minutes for 100+ commits
# Accuracy: 100% (automated validation)
```

**What you get:**
- Exact commit that introduced bug
- No manual testing of dozens of commits
- Scientific certainty, not guessing

---

### Mode 4: Golden State Management (Preservation)

**Use when:** Have a working state worth preserving
```bash
# 1. Validate everything
npm run validate-sst
npm run detect-drift
npm run test:contracts
npm run test:visual

# 2. Generate evidence
npm run build-evidence

# 3. Capture golden state
./scripts/git-forensics/capture-golden-state.sh

# Creates:
# - Tag: golden/opening-YYYYMMDD-HHMMSS
# - Evidence: reports/opening-sequence-golden-*.md
# - Metadata: reports/opening-sequence-golden-*.json
# - Git commit with all validation results

# Time: 5 minutes
# Value: Permanent restoration point
```

**What you get:**
- Immutable tag for instant restoration
- Complete evidence at that state
- Validation proof
- Future comparison baseline

---

## Evidence-First Principle

### Why Evidence First?

**Without evidence:**
```
"Where is PARTICLES_EMERGED emitted?"
→ grep -r "PARTICLES_EMERGED" src/
→ 47 results
→ Read them all
→ Mental mapping
→ 30 minutes
→ Maybe wrong
```

**With evidence:**
```
npm run build-evidence (5 seconds)
→ reports/beatbus-map.json shows:
   PARTICLES_EMERGED:
     emitters: [WebGLBackground.jsx:342]
     listeners: [OpeningController.js:156, Theater.js:89]
→ Exact answer
→ 100% accurate
```

### Evidence Types

**1. Event Flow (beatbus-map.json)**
```json
{
  "PARTICLES_EMERGED": {
    "emitters": [
      { "file": "components/webgl/WebGLBackground.jsx", "line": 342 }
    ],
    "listeners": [
      { "file": "theater/controllers/OpeningController.js", "line": 156 },
      { "file": "theater/TheaterDirector.js", "line": 89 }
    ]
  }
}
```

**2. Pattern Distribution (source-hits.json)**
```json
{
  "MOTION_MODE": [
    { "file": "engine/ConsciousnessEngine.js", "line": 234, "context": "..." },
    { "file": "components/webgl/WebGLBackground.jsx", "line": 567, "context": "..." }
  ]
}
```

**3. Configuration State (sst-extract.json)**
```json
{
  "opening": {
    "timeline": {
      "profile": "chaos_coalesce_settle_v1",
      "phases": {
        "chaos": { "duration": 3000 },
        "coalesce": { "duration": 2000 }
      }
    }
  }
}
```

---

## Complete Workflows

### Workflow 1: "Find When It Broke"
...
