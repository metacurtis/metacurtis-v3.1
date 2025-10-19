#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 COMPLETE STATE MANAGEMENT AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# Create audit directory
mkdir -p state-audit
cd state-audit

# 1. FIND ALL STATE-RELATED FILES
echo -e "\n📁 PHASE 1: LOCATING ALL STATE FILES"
echo "─────────────────────────────────────────────────────────────"

echo -e "\n🔷 Atom Files:"
find ../src -name "*atom*.js" -o -name "*Atom*.js" | sort | while read file; do
    echo "  📄 $file"
    # Check if it's actually an atom
    if grep -q "createAtom\|atom\." "$file" 2>/dev/null; then
        echo "     ✓ Real atom file"
    else
        echo "     ⚠️ Name suggests atom but may not be"
    fi
done

echo -e "\n🔷 Store Files:"
find ../src -name "*store*.js" -o -name "*Store*.js" | sort | while read file; do
    echo "  📄 $file"
    # Check what pattern it uses
    if grep -q "createStore\|useState\|zustand" "$file" 2>/dev/null; then
        echo "     ✓ Active store"
    else
        echo "     ⚠️ May be inactive/legacy"
    fi
done

echo -e "\n🔷 State Hooks:"
find ../src -path "*/hooks/*" -name "*.js" | grep -E "(use|atom|store|state)" | sort | while read file; do
    echo "  📄 $file"
done

# 2. ANALYZE EACH ATOM FILE
echo -e "\n📊 PHASE 2: ATOM FILE ANALYSIS"
echo "─────────────────────────────────────────────────────────────"

for atomFile in ../src/stores/atoms/*.js; do
    if [ -f "$atomFile" ]; then
        filename=$(basename "$atomFile")
        echo -e "\n📄 $filename:"
        echo "────────────────"
        
        # Extract key information
        echo "  Key/Name:"
        grep -E "key:|name:" "$atomFile" | head -1
        
        echo "  Default value:"
        grep -A5 "default:" "$atomFile" | head -6
        
        echo "  Exports:"
        grep "^export" "$atomFile"
        
        echo "  Used by:"
        grep -r "$(basename $atomFile .js)" ../src --include="*.js" --include="*.jsx" | grep -v "$atomFile:" | cut -d: -f1 | sort | uniq | head -5
    fi
done

# 3. IDENTIFY REDUNDANT STATE SYSTEMS
echo -e "\n⚠️ PHASE 3: REDUNDANCY DETECTION"
echo "─────────────────────────────────────────────────────────────"

echo -e "\n🔴 Potential Redundancies:"

# Check for duplicate narrative state
echo -e "\nNarrative State Management:"
echo "  Atoms:"
find ../src -name "*narrative*atom*.js" -o -name "*Narrative*Atom*.js" | sort
echo "  Stores:"
find ../src -name "*narrative*store*.js" -o -name "*Narrative*Store*.js" | grep -v atom | sort
echo "  Hooks:"
find ../src -name "*narrative*.js" | grep hook | sort

# Check for duplicate performance state
echo -e "\nPerformance State Management:"
echo "  Atoms:"
find ../src -name "*performance*atom*.js" -o -name "*Performance*Atom*.js" | sort
echo "  Stores:"
find ../src -name "*performance*store*.js" -o -name "*Performance*Store*.js" | grep -v atom | sort

# Check for duplicate quality state
echo -e "\nQuality State Management:"
echo "  Atoms:"
find ../src -name "*quality*atom*.js" -o -name "*Quality*Atom*.js" | sort
echo "  Related:"
find ../src -name "*quality*.js" | grep -v atom | sort

# 4. IMPORT/EXPORT MAPPING
echo -e "\n🔗 PHASE 4: IMPORT/EXPORT RELATIONSHIPS"
echo "─────────────────────────────────────────────────────────────"

echo -e "\n📥 Who imports atoms directly:"
grep -r "from.*atoms" ../src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq | while read file; do
    relpath=$(realpath --relative-to=../src "$file")
    imports=$(grep "from.*atoms" "$file" | grep -oE "{ *[^}]+ *}" | tr -d '{}' | tr ',' '\n' | xargs)
    echo "  $relpath:"
    echo "    → $imports"
done

echo -e "\n📥 Who imports stores directly:"
grep -r "from.*Store" ../src --include="*.js" --include="*.jsx" | grep -v "atoms" | cut -d: -f1 | sort | uniq | while read file; do
    relpath=$(realpath --relative-to=../src "$file")
    store=$(grep "from.*Store" "$file" | grep -oE "['\"].*['\"]" | tr -d "'\"" | xargs basename)
    echo "  $relpath → $store"
done

# 5. CREATEATOM IMPLEMENTATION CHECK
echo -e "\n⚙️ PHASE 5: ATOM IMPLEMENTATION ANALYSIS"
echo "─────────────────────────────────────────────────────────────"

echo -e "\n�� createAtom.js implementation:"
if [ -f "../src/stores/atoms/createAtom.js" ]; then
    echo "  Location: src/stores/atoms/createAtom.js"
    echo "  Exports:"
    grep "^export" ../src/stores/atoms/createAtom.js
    echo "  Core functions:"
    grep -E "function |const.*=" ../src/stores/atoms/createAtom.js | grep -v "//" | head -5
else
    echo "  ⚠️ createAtom.js not found in expected location!"
fi

# 6. CHECK FOR CONFLICTING PATTERNS
echo -e "\n🔴 PHASE 6: CONFLICT DETECTION"
echo "─────────────────────────────────────────────────────────────"

echo -e "\n⚠️ Files using multiple state patterns:"
for file in $(find ../src -name "*.jsx" -o -name "*.js"); do
    hasAtom=$(grep -l "atom\." "$file" 2>/dev/null)
    hasStore=$(grep -l "Store\." "$file" 2>/dev/null)
    hasUseState=$(grep -l "useState" "$file" 2>/dev/null)
    
    count=0
    patterns=""
    [ "$hasAtom" ] && ((count++)) && patterns="$patterns atom"
    [ "$hasStore" ] && ((count++)) && patterns="$patterns store"
    [ "$hasUseState" ] && ((count++)) && patterns="$patterns useState"
    
    if [ $count -gt 1 ]; then
        echo "  $(basename $file): $patterns"
    fi
done

# 7. ATOM SUBSCRIPTION PATTERNS
echo -e "\n🔔 PHASE 7: ATOM SUBSCRIPTION ANALYSIS"
echo "─────────────────────────────────────────────────────────────"

echo -e "\nFiles subscribing to atoms:"
grep -r "\.subscribe\|\.listen\|useAtom" ../src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq | while read file; do
    relpath=$(realpath --relative-to=../src "$file")
    echo "  $relpath"
done

# 8. GENERATE SUMMARY REPORT
echo -e "\n📊 PHASE 8: SUMMARY REPORT"
echo "─────────────────────────────────────────────────────────────"

# Count files
atomCount=$(find ../src -name "*atom*.js" -o -name "*Atom*.js" | wc -l)
storeCount=$(find ../src -name "*store*.js" -o -name "*Store*.js" | grep -v atom | wc -l)
hookCount=$(find ../src -path "*/hooks/*" -name "*.js" | wc -l)

echo "  Total atom files: $atomCount"
echo "  Total store files: $storeCount"
echo "  Total hook files: $hookCount"

echo -e "\n📋 Recommended Actions:"
echo "  1. Consolidate to single atom pattern"
echo "  2. Remove redundant store files"
echo "  3. Standardize import paths"
echo "  4. Create State Command Layer for orchestration"

