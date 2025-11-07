# Bisect Oracle System

**Automated regression finding through binary search**

---

## Overview

The Bisect Oracle automates the process of finding which commit introduced a bug by using your existing validation stack as a test oracle. Instead of manually testing dozens of commits, the oracle does it automatically in 5-15 minutes.

## How It Works

### Traditional Manual Bisect
```bash
git bisect start
git bisect bad HEAD
git bisect good abc1234

# Git checks out a commit
npm install
npm run dev
# Manually test in browser
git bisect good  # or bad

# Repeat 7-10 times for 100 commits
# Takes 1-2 hours
```

### Automated Oracle Bisect
```bash
git bisect start
git bisect bad HEAD
git bisect good abc1234
git bisect run ./scripts/git-forensics/oracle-opening.sh

# Git + Oracle do everything
# Takes 5-15 minutes
```

---

## Oracle Architecture

### Exit Codes (Git Bisect Protocol)
```bash
0   = GOOD - Commit passes all checks
1   = BAD  - Commit fails checks
125 = SKIP - Cannot test this commit (build fails, etc.)
```

### Validation Layers

The oracle runs your complete validation stack:
```
Layer 1: Constitutional
├── npm run validate-sst      # SST schema valid?
└── npm run detect-drift      # No hardcoded values?

Layer 2: Contracts
├── npm run validate:opening  # Opening checks pass?
└── npm run ci:fencepost      # Fencepost arrives?

Layer 4: Visual (Optional)
└── npm run test:visual       # Visual tests pass?

All pass → exit 0 (GOOD)
Any fail → exit 1 (BAD)
Can't build → exit 125 (SKIP)
```

---

## Oracle Implementation

### Basic Oracle (Opening Sequence)

**File:** `scripts/git-forensics/oracle-opening.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

# Install dependencies (might have changed)
npm install >/dev/null 2>&1 || exit 125  # Can't build = SKIP

# Layer 1: Constitutional
npm run validate-sst >/dev/null 2>&1 || exit 1
npm run detect-drift >/dev/null 2>&1 || exit 1

# Layer 2: Contracts (opening-specific)
npm run validate:opening >/dev/null 2>&1 || exit 1
npm run ci:fencepost >/dev/null 2>&1 || exit 1

# All passed
exit 0
```

### Advanced Oracle (With Evidence)

**File:** `scripts/git-forensics/oracle-opening-with-evidence.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

ORACLE_LOG="bisect-oracle-$(date +%s).log"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$ORACLE_LOG"
}

log "Testing commit: $(git rev-parse --short HEAD)"

# Install dependencies
log "Installing dependencies..."
if ! npm install >/dev/null 2>&1; then
  log "Cannot build, skipping"
  exit 125
fi

# Layer 1: Constitutional
log "Layer 1: Constitutional validation..."
if ! npm run validate-sst >/dev/null 2>&1; then
  log "SST validation failed"
  exit 1
fi

if ! npm run detect-drift >/dev/null 2>&1; then
  log "Drift detected"
  exit 1
fi

# Layer 2: Contracts
log "Layer 2: Contract validation..."
if ! npm run validate:opening >/dev/null 2>&1; then
  log "Opening validation failed"
  exit 1
fi

if ! npm run ci:fencepost >/dev/null 2>&1; then
  log "Fencepost check failed"
  exit 1
fi

# Generate evidence (for analysis later)
log "Generating evidence..."
if npm run build-evidence >/dev/null 2>&1; then
  COMMIT=$(git rev-parse --short HEAD)
  cp reports/investigation-report-*.md "bisect-evidence-$COMMIT.md" 2>/dev/null || true
fi

log "All checks passed"
exit 0
```

### Fast Oracle (Quick Iteration)

**File:** `scripts/git-forensics/oracle-fast.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

# Skip npm install if node_modules exists and package.json unchanged
if [ -f "node_modules/.package-lock.json" ]; then
  CURRENT_LOCK=$(md5sum package-lock.json 2>/dev/null | cut -d' ' -f1)
  CACHED_LOCK=$(cat node_modules/.package-lock.json 2>/dev/null || echo "")
  
  if [ "$CURRENT_LOCK" = "$CACHED_LOCK" ]; then
    echo "Dependencies unchanged, skipping install"
  else
    npm install >/dev/null 2>&1 || exit 125
    echo "$CURRENT_LOCK" > node_modules/.package-lock.json
  fi
else
  npm install >/dev/null 2>&1 || exit 125
fi

# Fast checks only (no visual tests)
npm run validate-sst >/dev/null 2>&1 || exit 1
npm run validate:opening >/dev/null 2>&1 || exit 1

exit 0
```

---

## Complete Bisect Workflows

### Workflow 1: Find Opening Sequence Regression
```bash
# === STEP 1: IDENTIFY GOOD AND BAD ===
# Bad: Current (opening broken)
BAD_COMMIT="HEAD"

# Good: Last golden state
git tag -l "golden/*" | tail -1
# golden/opening-20250106-120000

GOOD_COMMIT="golden/opening-20250106-120000"

# Or find by date
git log --oneline --since="1 week ago" | tail -1
# abc1234 worked last week

GOOD_COMMIT="abc1234"

# === STEP 2: START BISECT ===
git bisect start

# Mark bad
git bisect bad $BAD_COMMIT

# Mark good
git bisect good $GOOD_COMMIT

# Git will say:
# "Bisecting: 50 revisions left to test after this (roughly 6 steps)"

# === STEP 3: RUN ORACLE ===
git bisect run ./scripts/git-forensics/oracle-opening.sh

# Git will:
# 1. Checkout midpoint commit
# 2. Run oracle
# 3. Mark good/bad based on exit code
# 4. Repeat binary search
# 5. Find first bad commit

# Output:
# abc1234567890 is the first bad commit
# commit abc1234567890
# Author: Curtis <...>
# Date: Tue Jan 7 15:30:00 2025
#
#     refactor(opening): consolidate phase logic
#
# :100644 100644 def... ghi... M  src/components/theater/OpeningSequence.jsx

# === STEP 4: ANALYZE BREAKING COMMIT ===
git show abc1234567890

# See exactly what changed

# === STEP 5: GENERATE EVIDENCE AT THAT COMMIT ===
git checkout abc1234567890
npm run build-evidence
cp reports/investigation-report-*.md reports/breaking-commit-evidence.md

# === STEP 6: RESET BISECT ===
git bisect reset

# You're back on your original branch

# === STEP 7: CREATE FIX ===
git checkout -b fix/opening-regression-abc1234

# Now you know:
# - Exact commit: abc1234567890
# - Exact files changed
# - System state at that point
# Make surgical fix
```

**Time:** 10-20 minutes total  
**Manual approach:** 2-4 hours

---

### Workflow 2: Find Performance Regression
```bash
# Create performance oracle
cat > scripts/git-forensics/oracle-performance.sh << 'PERF_ORACLE'
#!/usr/bin/env bash
set -euo pipefail

npm install >/dev/null 2>&1 || exit 125

# Run performance checks
npm run doctor:perf:strict >/dev/null 2>&1 || exit 1

# Check FPS in automated test
RESULT=$(npm run test:visual -- tests/visual/performance.spec.ts 2>&1)

if echo "$RESULT" | grep -q "FPS.*60"; then
  exit 0  # Good performance
else
  exit 1  # Performance regression
fi
PERF_ORACLE

chmod +x scripts/git-forensics/oracle-performance.sh

# Run bisect
git bisect start
git bisect bad HEAD
git bisect good golden/perf-60fps-20250105
git bisect run scripts/git-forensics/oracle-performance.sh

# Find exact commit that dropped FPS
```

---

### Workflow 3: Multiple Issues (Separate Bisects)
```bash
# Issue 1: Opening broken
git bisect start
git bisect bad HEAD
git bisect good golden/opening-20250106
git bisect run ./scripts/git-forensics/oracle-opening.sh
# Result: abc1234
git bisect reset

# Document finding
echo "Opening broke at: abc1234" > bisect-findings.txt

# Issue 2: Performance dropped
git bisect start
git bisect bad HEAD
git bisect good golden/perf-20250105
git bisect run ./scripts/git-forensics/oracle-performance.sh
# Result: def5678
git bisect reset

# Document finding
echo "Performance dropped at: def5678" >> bisect-findings.txt

# Now you have two separate root causes
cat bisect-findings.txt
```

---

## Oracle Design Patterns

### Pattern 1: Layered Validation

**Principle:** Fast checks first, slow checks only if needed
```bash
#!/usr/bin/env bash
set -euo pipefail

# Fast: Schema validation (< 1 second)
npm run validate-sst >/dev/null 2>&1 || exit 1

# Fast: Static analysis (< 2 seconds)
npm run validate:opening >/dev/null 2>&1 || exit 1

# Medium: Contract tests (< 5 seconds)
npm run test:contracts >/dev/null 2>&1 || exit 1

# Slow: Visual tests (only if THOROUGH=1)
if [ "${THOROUGH:-0}" = "1" ]; then
  npm run test:visual >/dev/null 2>&1 || exit 1
fi

exit 0
```

**Usage:**
```bash
# Fast bisect (5-10 mins)
git bisect run ./scripts/git-forensics/oracle-opening.sh

# Thorough bisect (20-30 mins)
THOROUGH=1 git bisect run ./scripts/git-forensics/oracle-opening.sh
```

---

### Pattern 2: Evidence Capture

**Principle:** Generate evidence at each tested commit for later analysis
```bash
#!/usr/bin/env bash
set -euo pipefail

COMMIT=$(git rev-parse --short HEAD)
EVIDENCE_DIR="bisect-evidence"
mkdir -p "$EVIDENCE_DIR"

# Run validation
npm run validate-sst >/dev/null 2>&1 || exit 1
npm run test:contracts >/dev/null 2>&1 || exit 1

# Capture evidence
npm run build-evidence >/dev/null 2>&1
cp reports/investigation-report-*.md "$EVIDENCE_DIR/evidence-$COMMIT.md" 2>/dev/null || true

exit 0
```

**After bisect:**
```bash
# Review all evidence
ls bisect-evidence/
# evidence-abc1234.md (GOOD)
# evidence-def5678.md (GOOD)
# evidence-ghi9012.md (BAD) ← First bad

# Compare evidence
diff bisect-evidence-def5678.md bisect-evidence-ghi9012.md
```

---

### Pattern 3: Conditional Skipping

**Principle:** Skip commits that can't be tested
```bash
#!/usr/bin/env bash
set -euo pipefail

# Check if critical files exist
if [ ! -f "src/engine/ConsciousnessEngine.js" ]; then
  echo "ConsciousnessEngine doesn't exist yet, skipping"
  exit 125
fi

# Check if dependencies can install
if ! npm install >/dev/null 2>&1; then
  echo "Cannot install dependencies, skipping"
  exit 125
fi

# Check if SST file exists (might not in old commits)
if [ ! -f "sst/canon/v3.5.json" ]; then
  echo "SST v3.5 doesn't exist, skipping"
  exit 125
fi

# Run validation
npm run validate-sst >/dev/null 2>&1 || exit 1
npm run test:contracts >/dev/null 2>&1 || exit 1

exit 0
```

---

## Troubleshooting Bisect

### Problem: All Commits Marked as BAD

**Symptom:** Bisect ends with oldest commit as "first bad"

**Cause:** Your "good" commit isn't actually good

**Solution:**
```bash
# Verify good commit manually
git checkout $GOOD_COMMIT
./scripts/git-forensics/oracle-opening.sh
echo $?  # Should be 0

# If it's 1, find an older good commit
git log --oneline | tail -20
# Test manually until you find a GOOD one
```

---

### Problem: Oracle Times Out

**Symptom:** Bisect gets stuck, oracle runs forever

**Cause:** No timeout on oracle operations

**Solution:**
```bash
#!/usr/bin/env bash
set -euo pipefail

# Add timeout to oracle
timeout 300 npm run test:contracts >/dev/null 2>&1 || exit 1
# 300 seconds = 5 minutes max per commit
```

---

### Problem: Too Many SKIPs

**Symptom:** Git skips 80% of commits

**Cause:** Oracle too strict about what's testable

**Solution:**
```bash
# Relax skip conditions
# Instead of:
[ ! -f "package.json" ] && exit 125

# Try:
if [ ! -f "package.json" ]; then
  # Create minimal package.json
  echo '{"name":"test"}' > package.json
fi

# Or make oracle work with older codebase structure
```

---

### Problem: Oracle Gives Inconsistent Results

**Symptom:** Same commit is GOOD then BAD

**Cause:** Non-deterministic tests, timing issues, race conditions

**Solution:**
```bash
# Add retries to oracle
#!/usr/bin/env bash
set -euo pipefail

MAX_ATTEMPTS=3
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if npm run test:contracts >/dev/null 2>&1; then
    exit 0  # Pass
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
```

exit 1```} } } 
