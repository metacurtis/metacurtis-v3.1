#!/bin/bash

echo "🔍 ATOM ARCHITECTURE RACE CONDITION DETECTION"
echo "=============================================="
echo ""

# ============================================================
# PATTERN 1: Atom Reads in Render (Should be useRecoilValue)
# ============================================================
echo "1. ATOM READS IN RENDER (Potential Side Effects)"
echo "------------------------------------------------"
grep -rn "getRecoilValue\|useRecoilState" src/components/ --include="*.jsx" | \
  grep -v "useRecoilValue" | \
  head -20
echo ""

# ============================================================
# PATTERN 2: Multiple Atom Sets in Sequence (No Batching)
# ============================================================
echo "2. MULTIPLE ATOM SETS IN SEQUENCE"
echo "------------------------------------------------"
for file in $(find src -name "*.jsx" -o -name "*.js"); do
  awk '/set.*Atom\(|useSetRecoilState/ {
    if (prev && NR-prevNR <= 3)
      print FILENAME ":" prevNR "-" NR " (potential batch issue)";
    prev=$0; prevNR=NR
  }' "$file"
done | head -15
echo ""

# ============================================================
# PATTERN 3: Atom Updates After Async (Stale State Risk)
# ============================================================
echo "3. ATOM UPDATES AFTER AWAIT (Stale State Risk)"
echo "------------------------------------------------"
grep -rn "await" src/ --include="*.jsx" --include="*.js" -A 5 | \
  grep -B 2 "set.*Atom\|useSetRecoilState" | \
  head -20
echo ""

# ============================================================
# PATTERN 4: ConsciousnessEngine Direct Mutations
# ============================================================
echo "4. CONSCIOUSNESSENGINE DIRECT MUTATIONS"
echo "------------------------------------------------"
grep -rn "engine\.\|ConsciousnessEngine\." src/ --include="*.jsx" | \
  grep -E "set|update|modify|mutate" | \
  grep -v "import" | \
  head -15
echo ""

# ============================================================
# PATTERN 5: Theater/Narration Controller Race Conditions
# ============================================================
echo "5. THEATER/NARRATION TIMING ISSUES"
echo "------------------------------------------------"
echo "=== Event Emitters (pushTrace/emit) ==="
grep -rn "pushTrace\|emit\(" src/components/consciousness/ src/components/theater/ \
  --include="*.jsx" --include="*.js" | head -10
echo ""
echo "=== Stage Transitions (stageAtom updates) ==="
grep -rn "stageAtom\|setStage" src/ --include="*.jsx" --include="*.js" | head -10
echo ""

# ============================================================
# PATTERN 6: Fragment Controller State Races
# ============================================================
echo "6. FRAGMENT CONTROLLER STATE RACES"
echo "------------------------------------------------"
grep -rn "fragment" src/components/ --include="*.jsx" -i | \
  grep -E "useState|useRecoilState|set[A-Z]" | \
  head -15
echo ""

# ============================================================
# PATTERN 7: Probe Calls During Render (Side Effects)
# ============================================================
echo "7. PROBE SIDE EFFECTS IN RENDER"
echo "------------------------------------------------"
grep -rn "window.probe\|probe\." src/components/ --include="*.jsx" | \
  grep -v "useEffect" | \
  grep -v "handler" | \
  grep -v "callback" | \
  grep -v "onClick" | \
  head -15
echo ""

# ============================================================
# PATTERN 8: Quality Atom Changes During Animation
# ============================================================
echo "8. QUALITY TIER CHANGES DURING RAF"
echo "------------------------------------------------"
grep -rn "requestAnimationFrame" src/ --include="*.js" --include="*.jsx" -A 8 | \
  grep -B 3 "qualityAtom\|setQuality" | \
  head -15
echo ""

# ============================================================
# PATTERN 9: Performance Atom Updates in Hot Path
# ============================================================
echo "9. PERFORMANCE ATOM UPDATES (FPS Tracking)"
echo "------------------------------------------------"
grep -rn "performanceAtom" src/ --include="*.js" --include="*.jsx" | \
  head -10
echo ""

# ============================================================
# PATTERN 10: Narration/Stage Coordination Gaps
# ============================================================
echo "10. NARRATION/STAGE COORDINATION"
echo "------------------------------------------------"
echo "=== Narration Controller Events ==="
grep -rn "START_NARRATIVE\|STOP_NARRATIVE" src/ --include="*.js" --include="*.jsx" | head -10
echo ""
echo "=== Stage Change Events ==="
grep -rn "STAGE_CHANGE\|stageAtom" src/ --include="*.js" --include="*.jsx" | head -10
echo ""

# ============================================================
# PATTERN 11: useEffect Cleanup Missing
# ============================================================
echo "11. USEEFFECT CLEANUP MISSING"
echo "------------------------------------------------"
for file in $(find src/components -name "*.jsx"); do
  if grep -q "useEffect" "$file"; then
    if grep -q "addEventListener" "$file" && \
       ! grep -q "removeEventListener" "$file"; then
      echo "⚠️  Potential leak: $file"
    fi
  fi
done | head -10
echo ""

# ============================================================
# PATTERN 12: Atom Selectors with Side Effects
# ============================================================
echo "12. ATOM SELECTORS WITH SIDE EFFECTS"
echo "------------------------------------------------"
grep -rn "selector\|selectorFamily" src/state/ --include="*.js" -A 10 | \
  grep -B 5 "console\|pushTrace\|window" | \
  head -20

