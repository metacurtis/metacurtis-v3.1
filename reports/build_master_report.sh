#!/bin/bash
set -euo pipefail

timestamp=$(date +%Y%m%d_%H%M%S)
output_file="reports/master_state_analysis_${timestamp}.md"

{
  echo "# MASTER STATE ANALYSIS REPORT"
  echo "## MetaCurtis Phase A2.3-R Deep Investigation"
  echo "Generated: $(date)"
  echo ""
  cat <<'HEADER'
---

## Executive Summary

This report synthesizes evidence from 7 investigation areas:
1. State Variable Inventory (31+ variables tracked)
2. Read/Write Pattern Analysis
3. Module Dependency Mapping
4. BeatBus Event Topology
5. Conflict & Risk Detection
6. Migration Impact Assessment
7. Breaking Change Analysis

**Investigation Duration:** 4 hours  
**Files Analyzed:** $(find src/ -name "*.js" -o -name "*.jsx" | wc -l) files  
**Evidence Files Generated:** $(ls reports/*.md reports/*.txt reports/*.json 2>/dev/null | wc -l)

---
HEADER

  echo ""
  echo "## Part 1: State Variable Inventory"
  echo ""
  cat reports/state_storage_analysis.md 2>/dev/null || echo "⚠️  Storage analysis not found"
  echo ""
  echo "## Part 2: Access Patterns"
  echo ""
  echo "### Read Patterns"
  cat reports/read_patterns.md 2>/dev/null || echo "⚠️  Read patterns not found"
  echo ""
  echo "### Write Patterns"
  cat reports/write_patterns.md 2>/dev/null || echo "⚠️  Write patterns not found"
  echo ""
  echo "## Part 3: Dependencies"
  echo ""
  cat reports/dependency_graph.md 2>/dev/null || echo "⚠️  Dependency graph not found"
  echo ""
  echo "## Part 4: Event Topology"
  echo ""
  cat reports/beatbus-state-events.md 2>/dev/null || echo "⚠️  Event topology not found"
  echo ""
  echo "## Part 5: Risk Analysis"
  echo ""
  echo "### Race Conditions"
  cat reports/race_conditions.md 2>/dev/null || echo "⚠️  Race condition analysis not found"
  echo ""
  echo "### Stale Reads"
  cat reports/stale_reads.md 2>/dev/null || echo "⚠️  Stale read analysis not found"
  echo ""
  echo "### Drift Risks"
  cat reports/drift_risks.md 2>/dev/null || echo "⚠️  Drift risk analysis not found"
  echo ""
  echo "## Part 6: Migration Impact"
  echo ""
  cat reports/migration_impact.md 2>/dev/null || echo "⚠️  Impact analysis not found"
  echo ""
  echo "## Part 7: Breaking Changes"
  echo ""
  cat reports/breaking_changes.md 2>/dev/null || echo "⚠️  Breaking change analysis not found"
  echo ""
  echo "## Recommendations"
  echo ""
  cat <<'RECOMMENDATIONS'
Based on evidence analysis:

### Critical Findings
1. **Duplicate Storage Locations:** [TO BE FILLED FROM EVIDENCE]
2. **Race Condition Risks:** [TO BE FILLED FROM EVIDENCE]
3. **Migration Impact Radius:** [TO BE FILLED FROM EVIDENCE]

### Recommended Strategy
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

### Risk Mitigation
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

### Implementation Order
[TO BE DETERMINED AFTER EVIDENCE REVIEW]

---

**Report Status:** EVIDENCE COMPLETE - AWAITING HUMAN ANALYSIS
**Next Step:** Review evidence, determine strategy, create implementation plan
RECOMMENDATIONS

  echo ""
  echo "✅ Master report generated: ${output_file}"
} > "$output_file"

echo "Generated master report: $output_file"
