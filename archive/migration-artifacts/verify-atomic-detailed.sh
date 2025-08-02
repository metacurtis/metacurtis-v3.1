#!/bin/bash
# Detailed verification and report for atomic migration

echo "🔍 MetaCurtis v3.0 - Atomic Migration Verification"
echo "================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0

# Check function
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if eval "$2"; then
        echo -e "${GREEN}✓${NC} $1"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Warning function
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# ========== ATOMIC STORES CHECK ==========
echo -e "${BLUE}📦 Checking Atomic Stores...${NC}"
echo "----------------------------"

check "narrativeAtom.js exists" "[ -f 'src/stores/atoms/narrativeAtom.js' ]"
check "performanceAtom.js exists" "[ -f 'src/stores/atoms/performanceAtom.js' ]"
check "interactionAtom.js exists" "[ -f 'src/stores/atoms/interactionAtom.js' ]"
check "resourceAtom.js exists" "[ -f 'src/stores/atoms/resourceAtom.js' ]"
check "Atoms index.js exists" "[ -f 'src/stores/atoms/index.js' ]"

# Check existing atoms
check "stageAtom.js already exists" "[ -f 'src/stores/atoms/stageAtom.js' ]"
check "qualityAtom.js already exists" "[ -f 'src/stores/atoms/qualityAtom.js' ]"
check "clockAtom.js already exists" "[ -f 'src/stores/atoms/clockAtom.js' ]"

echo ""

# ========== COMPATIBILITY HOOKS CHECK ==========
echo -e "${BLUE}🪝 Checking Compatibility Hooks...${NC}"
echo "----------------------------------"

check "useNarrativeStore hook exists" "[ -f 'src/hooks/atoms/useNarrativeStore.js' ]"
check "usePerformanceStore hook exists" "[ -f 'src/hooks/atoms/usePerformanceStore.js' ]"
check "useInteractionStore hook exists" "[ -f 'src/hooks/atoms/useInteractionStore.js' ]"
check "useResourceStore hook exists" "[ -f 'src/hooks/atoms/useResourceStore.js' ]"

echo ""

# ========== WRAPPER STORES CHECK ==========
echo -e "${BLUE}🔄 Checking Wrapper Stores...${NC}"
echo "-----------------------------"

check "narrativeStore.js wrapper exists" "[ -f 'src/stores/narrativeStore.js' ]"
check "performanceStore.js wrapper exists" "[ -f 'src/stores/performanceStore.js' ]"
check "useInteractionStore.js wrapper exists" "[ -f 'src/stores/useInteractionStore.js' ]"
check "resourceStore.js wrapper exists" "[ -f 'src/stores/resourceStore.js' ]"

echo ""

# ========== COMPONENT COMPATIBILITY CHECK ==========
echo -e "${BLUE}🧩 Checking Component Compatibility...${NC}"
echo "--------------------------------------"

# Components that should work with new atomic system
COMPONENTS=(
    "src/components/ui/narrative/MemoryFragments.jsx"
    "src/components/ui/navigation/StageController.jsx"
    "src/components/ui/narrative/StageNavigation.jsx"
    "src/components/webgl/narrative/SimpleStageController.jsx"
    "src/components/ConsolidatedNavigationController.jsx"
    "src/components/ui/ResourceMonitor.jsx"
    "src/components/ui/Typewriter.jsx"
    "src/components/ui/AdvancedContactPortal.jsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "$component" ]; then
        # Check if it imports from stores (which now point to atomic)
        if grep -q "from '@/stores/" "$component" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $(basename $component) - uses store imports (will use atomic)"
        else
            warn "$(basename $component) - might need import updates"
        fi
    else
        warn "$(basename $component) - file not found"
    fi
done

echo ""

# ========== ZUSTAND CLEANUP CHECK ==========
echo -e "${BLUE}🧹 Checking Zustand Cleanup...${NC}"
echo "------------------------------"

# Check for zustand imports
echo -n "Checking for zustand imports... "
if grep -r "from 'zustand'" src/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "backup"; then
    echo -e "${RED}Found!${NC}"
    warn "Zustand imports still present"
else
    echo -e "${GREEN}None found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check package.json
check "Zustand removed from package.json" "! grep -q '\"zustand\"' package.json 2>/dev/null"

echo ""

# ========== LEGACY FILES CHECK ==========
echo -e "${BLUE}📁 Checking Legacy Files...${NC}"
echo "---------------------------"

if [ -f "src/stores/narrativeStore.legacy.backup" ]; then
    warn "Legacy narrativeStore backup still in stores directory"
fi

if [ -d "archive/zustand-migration-backup" ]; then
    echo -e "${GREEN}✓${NC} Legacy files moved to archive"
else
    warn "Legacy files not archived"
fi

echo ""

# ========== WIRING CHECK ==========
echo -e "${BLUE}🔌 Checking SST v3.0 Wiring...${NC}"
echo "------------------------------"

check "wireSSTv3.js exists" "[ -f 'src/bootstrap/wireSSTv3.js' ]"

if [ -f "src/bootstrap/wireSSTv3.js" ]; then
    if grep -q "narrativeAtom" src/bootstrap/wireSSTv3.js 2>/dev/null; then
        echo -e "${GREEN}✓${NC} wireSSTv3.js uses atomic stores"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        warn "wireSSTv3.js might not be updated for atomic stores"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""

# ========== IMPORT ANALYSIS ==========
echo -e "${BLUE}📊 Import Analysis...${NC}"
echo "--------------------"

echo "Store import usage:"
for store in narrativeStore performanceStore interactionStore resourceStore; do
    count=$(grep -r "from.*${store}" src/ --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "  ${store}: ${count} imports"
    fi
done

echo ""

# ========== POTENTIAL ISSUES ==========
echo -e "${BLUE}⚠️  Potential Issues to Check...${NC}"
echo "--------------------------------"

# Check for multiple navigation controllers
nav_controllers=$(find src -name "*Controller*.jsx" -o -name "*Navigation*.jsx" | grep -E "(Stage|Navigation|Controller)" | wc -l)
if [ $nav_controllers -gt 3 ]; then
    warn "Multiple navigation controllers detected ($nav_controllers files) - consider consolidation"
fi

# Check for conflicting stage management
if [ -f "src/components/consciousness/ConsciousnessTheater.jsx" ]; then
    if grep -q "stageAtom" src/components/consciousness/ConsciousnessTheater.jsx && \
       grep -q "narrativeAtom" src/components/consciousness/ConsciousnessTheater.jsx; then
        warn "ConsciousnessTheater uses both stageAtom and narrativeAtom - ensure they're synchronized"
    fi
fi

echo ""

# ========== SUMMARY ==========
echo "======================================"
echo -e "${BLUE}📈 Migration Summary${NC}"
echo "======================================"
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}✅ Migration appears successful! (${SUCCESS_RATE}% passed)${NC}"
    echo ""
    echo "Recommended next steps:"
    echo "1. Run 'npm run dev' to test the application"
    echo "2. Check browser console for any runtime errors"
    echo "3. Test stage navigation and memory fragments"
    echo "4. Verify performance monitoring works"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Migration partially complete (${SUCCESS_RATE}% passed)${NC}"
    echo ""
    echo "Please address the failed checks and warnings above."
else
    echo -e "${RED}❌ Migration needs attention (${SUCCESS_RATE}% passed)${NC}"
    echo ""
    echo "Multiple issues detected. Review the output above."
fi

echo ""
echo "💡 Tips:"
echo "- All stores are available at window.atoms in dev mode"
echo "- Use window.narrativeAtom.getNarrativeSnapshot() to check state"
echo "- Run 'npm run build' to ensure no build errors"
echo ""

# Create a detailed report file
cat > migration-report.txt << EOF
MetaCurtis v3.0 Atomic Migration Report
Generated: $(date)

Summary:
- Total Checks: $TOTAL_CHECKS
- Passed: $PASSED_CHECKS
- Failed: $((TOTAL_CHECKS - PASSED_CHECKS))
- Warnings: $WARNINGS
- Success Rate: ${SUCCESS_RATE}%

Files Created:
$(find src/stores/atoms -name "*.js" 2>/dev/null | sort)
$(find src/hooks/atoms -name "*.js" 2>/dev/null | sort)

Components Using Stores:
$(grep -r "useNarrativeStore\|usePerformanceStore\|useInteractionStore\|useResourceStore" src/ --include="*.jsx" --include="*.js" 2>/dev/null | cut -d: -f1 | sort | uniq)

Next Steps:
1. Test application functionality
2. Resolve any warnings
3. Consider consolidating navigation controllers
4. Remove backup files after verification
EOF

echo "📄 Detailed report saved to: migration-report.txt"


