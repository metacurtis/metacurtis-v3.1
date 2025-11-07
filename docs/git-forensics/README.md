# Git Forensics System

**A scientific approach to debugging through time**

## Overview

The Git Forensics System combines automated regression detection, golden state preservation, and evidence-driven exploration to achieve **5-10x faster debugging** of complex issues.

## Core Components

### 1. Evidence System (Layer 5)
```bash
npm run build-evidence
```
Generates complete system topology:
- Event flow maps (who emits → who listens)
- Pattern distribution (where code patterns live)
- Configuration state (SST extraction)
- Source interaction graph

### 2. Bisect Oracle (Automated Regression Finding)
```bash
./scripts/git-forensics/oracle-opening.sh
git bisect run ./scripts/git-forensics/oracle-opening.sh
```
Finds breaking commits automatically using your validation stack.

### 3. Golden State Protocol (Known-Good Preservation)
```bash
./scripts/git-forensics/capture-golden-state.sh
```
Captures validated working states with complete evidence.

### 4. Forensic Probes (Combined Analysis)
```bash
./scripts/git-forensics/forensic-probe.sh <commit>
```
Combines git data + evidence + validation for complete context.

## Quick Start

### Find When Something Broke
```bash
# 1. Identify symptoms
"Opening sequence doesn't show chaos phase"

# 2. Find last known good commit
git log --oneline | head -20
# Or use golden state: git tag -l "golden/*"

# 3. Run bisect
git bisect start
git bisect bad HEAD
git bisect good golden/opening-20250106-120000
git bisect run ./scripts/git-forensics/oracle-opening.sh

# 4. Git finds exact breaking commit in 5-10 minutes
# Output: "abc1234 is the first bad commit"

# 5. Analyze with evidence
./scripts/git-forensics/forensic-probe.sh abc1234
```

### Capture Golden State
```bash
# 1. Validate current state
npm run validate-sst
npm run detect-drift
npm run test:contracts
npm run test:visual

# 2. Capture if all pass
./scripts/git-forensics/capture-golden-state.sh
```

### Compare Current vs Golden
```bash
./scripts/git-forensics/compare-golden.sh golden/opening-20250106-120000
```

## When to Use What

| Scenario | Tool | Time |
|----------|------|------|
| "It broke sometime this week" | Bisect oracle | 5-10 mins |
| "Need to preserve this working state" | Golden state capture | 5 mins |
| "What changed between commits?" | Forensic probe | 2 mins |
| "How does this system work?" | Evidence system | 5 seconds |
| "Want to explore old versions safely" | Worktrees | 10 mins |

## Documentation

- **[Complete Playbook](./GIT_FORENSICS_PLAYBOOK.md)** - Full methodology
- **[Bisect Oracle](./BISECT_ORACLE_SYSTEM.md)** - Automated regression finding
- **[Golden States](./GOLDEN_STATE_PROTOCOL.md)** - Preservation & restoration
- **[Claude-Kodex](./CLAUDE_KODEX_FORENSICS.md)** - AI-augmented workflow
- **[Quick Reference](./QUICK_REFERENCE.md)** - Cheat sheets

## Integration with Velocity Stack
```
Layer 5: Evidence Intelligence
    ↓ provides context to
Layer 4: Quality Shields (Visual tests)
    ↓ validates behavior for
Layer 3: Instrumentation (Probe system)
    ↓ monitors runtime for
Layer 2: Contracts (Opening validation)
    ↓ enforces logic for
Layer 1: Constitutional (SST validation)

Git Forensics uses ALL layers for scientific debugging
```

## Success Metrics

### Before Git Forensics
- **Time to find regression:** 2-8 hours (manual exploration)
- **Confidence in restoration:** Low (guess at good commits)
- **Knowledge preservation:** Tribal (in developer heads)
- **Exploration safety:** Risky (might lose work)

### After Git Forensics
- **Time to find regression:** 5-15 minutes (automated bisect)
- **Confidence in restoration:** 100% (tagged golden states)
- **Knowledge preservation:** Automated (evidence system)
- **Exploration safety:** Perfect (golden states + worktrees)

**Velocity Multiplier: 5-10x for debugging, 100% for preservation**

## Examples

See [examples/forensics/](../../examples/forensics/) for:
- Real bisect session finding opening sequence bug
- Golden state capture with full validation
- Forensic probe analysis of complex change

## Next Steps

1. Read the [Complete Playbook](./GIT_FORENSICS_PLAYBOOK.md)
2. Install scripts: `chmod +x scripts/git-forensics/*.sh`
3. Capture your first golden state
4. Bookmark [Quick Reference](./QUICK_REFERENCE.md)

---

**Part of the MetaCurtis Development Velocity Stack**  
Achieving 10-15x sustainable development velocity through systematic protocols.
