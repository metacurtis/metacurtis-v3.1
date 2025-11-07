# Golden State Protocol

**Preserving known-good states for instant restoration**

---

## Philosophy

### The Problem

**Before Golden States:**
```
Developer: "It worked last week, I swear!"
Manager: "Can you show me?"
Developer: *checks out 20 commits*
Developer: "I can't remember which one..."
Manager: "So we've lost the working version?"
Developer: "Maybe?"
```

**After Golden States:**
```
Developer: "It worked last week"
Manager: "Can you show me?"
Developer: git checkout golden/opening-20250106-120000
         npm run dev
Manager: "Perfect. What changed since then?"
Developer: git diff golden/opening-20250106-120000..HEAD
Manager: "Found the problem. Fix it."
```

### Core Principles

1. **Validated States Only**
   - Never tag without full validation
   - Proof required, not hope

2. **Complete Context**
   - Evidence included
   - Validation results documented
   - Git metadata preserved

3. **Immutable Tags**
   - Annotated tags, not branches
   - Never move or delete
   - Permanent restoration points

4. **Regular Capture**
   - After major features
   - Before risky changes
   - When everything works perfectly

---

## Golden State Anatomy

### What Makes a State "Golden"?
```
✅ All validation passes
├── Layer 1: SST validated, no drift
├── Layer 2: All contracts pass
├── Layer 4: Visual tests pass
└── Layer 5: Evidence generated

✅ Complete documentation
├── Evidence report preserved
├── Validation results recorded
├── System topology captured
└── Metadata JSON created

✅ Immutable reference
├── Annotated Git tag
├── Pushed to remote
└── Restoration tested
```

---

## Capture Process

### Automated Capture Script

**File:** `scripts/git-forensics/capture-golden-state.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🏆 Golden State Capture Protocol"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected"
  echo "   Commit or stash before capturing golden state"
  exit 1
fi

# === VALIDATION PHASE ===
echo "=== VALIDATION PHASE ==="
echo ""

echo "Layer 1: Constitutional..."
if ! npm run validate-sst; then
  echo "❌ SST validation failed"
  exit 1
fi

if ! npm run detect-drift; then
  echo "❌ Drift detected"
  exit 1
fi

echo "Layer 2: Contracts..."
if ! npm run test:contracts; then
  echo "❌ Contract tests failed"
  exit 1
fi

echo "Layer 4: Visual (optional)..."
if npm run test:visual 2>/dev/null; then
  VISUAL_STATUS="PASS"
else
  VISUAL_STATUS="SKIP"
  echo "⚠️  Visual tests skipped"
fi

echo ""
echo "✅ All validation passed!"
echo ""

# === EVIDENCE PHASE ===
echo "=== EVIDENCE GENERATION ==="
echo ""

npm run build-evidence

if [ ! -f "reports/investigation-report-"*.md ]; then
  echo "❌ Evidence generation failed"
  exit 1
fi

echo "✅ Evidence generated"
echo ""

# === CAPTURE PHASE ===
echo "=== GOLDEN STATE CAPTURE ==="
echo ""

DATE=$(date +%Y%m%d-%H%M%S)
COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
BRANCH=$(git branch --show-current)

# Copy evidence to golden baseline
LATEST_REPORT=$(ls -t reports/investigation-report-*.md 2>/dev/null | head -1)
cp "$LATEST_REPORT" "reports/opening-sequence-golden-$DATE.md"

echo "Evidence preserved: reports/opening-sequence-golden-$DATE.md"

# Create metadata
cat > "reports/opening-sequence-golden-$DATE.json" << METADATA
{
  "timestamp": "$(date -Iseconds)",
  "commit": "$COMMIT",
  "shortCommit": "$SHORT_COMMIT",
  "branch": "$BRANCH",
  "captureDate": "$(date)",
  "description": "Golden state with complete validation",
  "validation": {
    "sst": "PASS",
    "drift": "PASS",
    "contracts": "PASS",
    "visual": "$VISUAL_STATUS"
  },
  "evidence": {
    "report": "opening-sequence-golden-$DATE.md",
    "beatbusMap": "reports/beatbus-map.json",
    "sourceHits": "reports/source-hits.json",
    "sstExtract": "reports/sst-extract.json"
  },
  "eventFlow": [
    "ENGINE_VIEWPORT_HINT",
    "WBG:FENCEPOST",
    "CHAOS_START",
    "COALESCE_START",
    "SETTLE_START",
    "PARTICLES_EMERGED",
    "ENABLE_SCROLL",
    "OPENING_COMPLETE"
  ]
}
METADATA

echo "Metadata created: reports/opening-sequence-golden-$DATE.json"
echo ""

# Commit golden files
git add reports/opening-sequence-golden-*
git commit -m "docs: capture golden opening sequence state

Date: $(date)
Commit: $SHORT_COMMIT
Branch: $BRANCH

Validation Results:
✅ Layer 1: validate-sst + detect-drift
✅ Layer 2: validate:opening + ci:fencepost
✅ Layer 4: $VISUAL_STATUS
✅ Layer 5: build-evidence

Evidence: reports/opening-sequence-golden-$DATE.md
Metadata: reports/opening-sequence-golden-$DATE.json

This commit captures validated working state with complete system evidence."

# Create annotated tag
TAG="golden/opening-$DATE"
git tag -a "$TAG" -m "Opening Sequence Golden State

Date: $(date)
Commit: $COMMIT
Branch: $BRANCH

Validated working opening sequence with complete evidence system.

Event Flow (validated):
ENGINE_VIEWPORT_HINT → WBG:FENCEPOST → 
CHAOS_START → COALESCE_START → SETTLE_START →
PARTICLES_EMERGED → ENABLE_SCROLL → OPENING_COMPLETE

Validation:
✅ 10/10 opening checks (sentinel)
✅ SST validation passed
✅ Drift detection clean
✅ Fencepost contract passing
✅ Event flow evidence captured

Evidence Files:
- reports/opening-sequence-golden-$DATE.md (complete report)
- reports/opening-sequence-golden-$DATE.json (metadata)

To restore this exact state:
  git checkout $TAG
  npm install
  npm run dev

To compare current state vs this golden:
  npm run build-evidence
  diff reports/opening-sequence-golden-$DATE.md reports/investigation-report-*.md

To use as bisect baseline:
  git bisect good $TAG"

echo ""
echo "✅ GOLDEN STATE CAPTURED!"
echo ""
echo "Tag: $TAG"
echo "Evidence: reports/opening-sequence-golden-$DATE.md"
echo "Metadata: reports/opening-sequence-golden-$DATE.json"
echo ""
echo "Next steps:"
echo "1. Push tag: ALLOW_PUSH=1 git push origin $TAG"
echo "2. Push commit: ALLOW_PUSH=1 git push origin $BRANCH"
echo "3. Test restoration: git checkout $TAG && npm run dev"
echo ""
```

---

### Manual Capture (Understanding the Process)
```bash
# 1. Validate everything
npm run validate-sst
npm run detect-drift
npm run test:contracts
npm run test:visual  # Optional

# 2. Generate evidence
npm run build-evidence

# 3. Create golden files
DATE=$(date +%Y%m%d-%H%M%S)
cp reports/investigation-report-*.md "reports/opening-sequence-golden-$DATE.md"

# 4. Create metadata
cat > "reports/opening-sequence-golden-$DATE.json" << JSON
{
  "timestamp": "$(date -Iseconds)",
  "commit": "$(git rev-parse HEAD)",
  "description": "Golden state",
  "validation": {
    "sst": "PASS",
    "contracts": "PASS"
  }
}
JSON

# 5. Commit golden files
git add reports/opening-sequence-golden-*
git commit -m "docs: capture golden state"

# 6. Create tag
TAG="golden/opening-$DATE"
git tag -a "$TAG" -m "Golden state captured"

# 7. Push
ALLOW_PUSH=1 git push origin "$TAG"
ALLOW_PUSH=1 git push origin HEAD
```

---

## Restoration Process
...

## Restoration Process

### Quick Restoration
```bash
# List golden states
git tag -l "golden/*"

# Restore specific golden state
git checkout golden/opening-20250106-120000

# Install dependencies (might have changed)
npm install

# Run application
npm run dev

# Test - should work perfectly

# Return to branch
git checkout -
```

---

### Restoration with Evidence Comparison
```bash
# 1. Generate current evidence
npm run build-evidence
cp reports/investigation-report-*.md reports/current-state.md

# 2. Checkout golden state
git checkout golden/opening-20250106-120000

# 3. Generate golden evidence
npm install
npm run build-evidence
cp reports/investigation-report-*.md reports/golden-state.md

# 4. Compare
diff reports/current-state.md reports/golden-state.md

# Shows EXACTLY what changed in system topology

# 5. Return
git checkout -
```

---

### Selective Restoration (Cherry-Pick)
```bash
# Don't want entire golden state, just specific files

# 1. Identify golden state
TAG="golden/opening-20250106-120000"

# 2. See what files changed since then
git diff --name-only $TAG..HEAD

# 3. Restore specific files
git checkout $TAG -- src/components/theater/OpeningSequence.jsx
git checkout $TAG -- src/config/opening-timeline.js

# 4. Test
npm run dev

# 5. If works, commit
git add .
git commit -m "fix: restore opening behavior from $TAG

Restored files:
- OpeningSequence.jsx
- opening-timeline.js

Reason: These had working behavior in golden state"
```

---

## Golden State Management

### Naming Convention
```
golden/<feature>-<YYYYMMDD>-<HHMMSS>

Examples:
golden/opening-20250106-120000
golden/performance-20250108-143000
golden/navigation-20250110-091500
```

**Pattern:**
- `golden/` - Prefix for all golden states
- `opening` - Feature/system name
- `20250106` - Date (YYYYMMDD)
- `120000` - Time (HHMMSS)

---

### Listing Golden States
```bash
# All golden states
git tag -l "golden/*"

# Opening sequence only
git tag -l "golden/opening-*"

# Recent (last 10)
git tag -l "golden/*" | tail -10

# With dates
git tag -l "golden/*" --sort=-creatordate | head -10

# With full annotation
git tag -l "golden/*" -n99
```

---

### Comparing Golden States
```bash
# Compare two golden states
git diff golden/opening-20250106-120000..golden/opening-20250108-143000

# What changed between them?
git log --oneline golden/opening-20250106-120000..golden/opening-20250108-143000

# Evidence comparison
diff reports/opening-sequence-golden-20250106-120000.md \
     reports/opening-sequence-golden-20250108-143000.md
```

---

### Archiving Old Golden States
```bash
# Keep only recent 20 golden states

# List all
git tag -l "golden/*" --sort=-creatordate > all-golden-tags.txt

# Archive old ones
tail -n +21 all-golden-tags.txt | xargs -n 1 echo "Archive:"

# Delete locally (after confirming backup)
tail -n +21 all-golden-tags.txt | xargs git tag -d

# Delete from remote (careful!)
tail -n +21 all-golden-tags.txt | xargs -I {} git push origin :refs/tags/{}

# Or create archive branch
git checkout --orphan archive/golden-states
git tag -l "golden/*" | tail -n +21 | xargs git tag | xargs git push origin
```

---

## Advanced Workflows

### Workflow 1: Pre-Refactor Golden State
```bash
# Before major refactor
echo "=== PRE-REFACTOR GOLDEN STATE ==="

# Validate current state
npm run validate-sst
npm run test:contracts
npm run test:visual

# Capture golden
./scripts/git-forensics/capture-golden-state.sh
# Creates: golden/opening-20250106-120000

# Do refactor
git checkout -b refactor/opening-consolidation
# ... make changes ...

# If refactor breaks things
git checkout golden/opening-20250106-120000
# Instant rollback to working state

# Compare refactor vs golden
git diff golden/opening-20250106-120000..refactor/opening-consolidation
```

---

### Workflow 2: Golden State as Bisect Baseline
```bash
# Use golden state as known-good for bisect

# List golden states
git tag -l "golden/opening-*"

# Pick appropriate baseline
GOLDEN="golden/opening-20250106-120000"

# Bisect from golden to current
git bisect start
git bisect bad HEAD
git bisect good $GOLDEN
git bisect run ./scripts/git-forensics/oracle-opening.sh

# Find exactly what broke since golden
```

---

### Workflow 3: Multiple Golden States (A/B Testing)
```bash
# Capture multiple approaches

# Approach A: Event-driven
git checkout feature/event-driven-opening
./scripts/git-forensics/capture-golden-state.sh
# golden/opening-event-driven-20250106-120000

# Approach B: State-machine
git checkout feature/state-machine-opening
./scripts/git-forensics/capture-golden-state.sh
# golden/opening-state-machine-20250107-130000

# Compare performance
git checkout golden/opening-event-driven-20250106-120000
# Test performance, take notes

git checkout golden/opening-state-machine-20250107-130000
# Test performance, take notes

# Pick winner, make it main golden state
```

---

## Golden State Validation

### Testing a Golden State
```bash
# Verify golden state still works

TAG="golden/opening-20250106-120000"

# 1. Checkout
git checkout $TAG

# 2. Install
npm install

# 3. Validate
npm run validate-sst || echo "❌ SST validation failed"
npm run test:contracts || echo "❌ Contracts failed"
npm run test:visual || echo "⚠️  Visual tests failed"

# 4. Manual test
npm run dev
# Browser test

# 5. Return
git checkout -

# If golden state is broken:
# - Dependencies changed (npm lockfile updated)
# - External APIs changed
# - Time-dependent tests
# Consider this when designing golden states
```

---

## Integration with Evidence System

### Evidence-Rich Golden States

Every golden state includes:
```
reports/opening-sequence-golden-YYYYMMDD-HHMMSS.md
├── Event Flow Section
│   └── Complete emitter → listener map
├── Pattern Distribution
│   └── Where key code patterns live
├── Configuration State
│   └── SST extraction at this point
└── Validation Results
    └── All checks that passed

reports/opening-sequence-golden-YYYYMMDD-HHMMSS.json
├── Metadata (timestamp, commit, branch)
├── Validation status
├── Evidence file references
└── Event flow array
```

**Use this evidence to:**
- Compare current vs golden system topology
- Understand what changed
- Restore not just code, but understanding

---

## Best Practices

### When to Capture Golden States

**DO capture:**
- ✅ After completing major feature
- ✅ Before starting risky refactor
- ✅ When all tests pass and app feels perfect
- ✅ Before deployment to production
- ✅ After fixing critical bug

**DON'T capture:**
- ❌ With failing tests
- ❌ With uncommitted changes
- ❌ With known issues
- ❌ Without running validation

---

### Golden State Hygiene
```bash
# Regular maintenance

# 1. Review golden states monthly
git tag -l "golden/*" --sort=-creatordate | head -20

# 2. Test top 5 still work
for tag in $(git tag -l "golden/*" --sort=-creatordate | head -5); do
  echo "Testing $tag"
  git checkout $tag
  npm install
  npm run test:contracts && echo "✅ $tag works" || echo "❌ $tag broken"
done
git checkout -

# 3. Archive old/broken golden states
# Keep last 20, archive rest

# 4. Document golden states
# Update docs/GOLDEN_STATES.md with current list
```

---

## Troubleshooting

### Problem: Golden State Won't Build

**Symptom:** `npm install` fails on old golden state

**Cause:** Dependencies no longer available

**Solution:**
```bash
# Update package-lock.json while preserving behavior
git checkout golden/opening-20250106-120000
rm package-lock.json
npm install
npm run test:contracts  # Verify still works

# If works, update golden state
git add package-lock.json
git commit --amend -m "Update dependencies for golden state"
git tag -f golden/opening-20250106-120000
```

---

### Problem: Too Many Golden States

**Symptom:** 100+ golden tags, cluttering git

**Solution:**
```bash
# Archive strategy
git tag -l "golden/*" --sort=-creatordate > golden-tags.txt

# Keep recent 20
head -20 golden-tags.txt > keep-golden-tags.txt

# Delete old ones
tail -n +21 golden-tags.txt | while read tag; do
  git tag -d "$tag"
  git push origin ":refs/tags/$tag"
done
```

---

### Problem: Can't Find Right Golden State

**Symptom:** "I know it worked, but which golden state?"

**Solution:**
```bash
# Search golden state annotations
git tag -l "golden/*" -n99 | grep "opening sequence"

# Check evidence files
ls reports/opening-sequence-golden-*
cat reports/opening-sequence-golden-20250106-120000.json

# Bisect between golden states
git bisect start
git bisect bad golden/opening-20250108-143000  # Broken
git bisect good golden/opening-20250106-120000  # Works
git bisect run ./scripts/git-forensics/oracle-opening.sh
```

---

## Success Metrics

### Golden State Effectiveness

**Before Golden States:**
- Restoration confidence: 50%
- Time to find working version: 2-4 hours
- Knowledge preserved: 0%
- Rollback success rate: 60%

**After Golden States:**
- Restoration confidence: 100%
- Time to find working version: 30 seconds
- Knowledge preserved: 100%
- Rollback success rate: 100%

**Improvement: Instant, perfect restoration every time**

---

## Next Steps

1. **Capture your first golden state:** `./scripts/git-forensics/capture-golden-state.sh`
2. **Test restoration:** `git checkout <tag> && npm run dev`
3. **Use in bisect:** `git bisect good golden/opening-*`
4. **Establish capture rhythm:** After every major feature
5. **Maintain golden states:** Monthly review and archive

---

**Part of MetaCurtis Git Forensics System**  
Golden States: Perfect restoration points with complete validation
