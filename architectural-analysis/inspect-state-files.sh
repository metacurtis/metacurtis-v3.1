#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔬 DEEP STATE FILE INSPECTION"
echo "═══════════════════════════════════════════════════════════════"

# Critical state files to inspect
STATE_FILES=(
    "src/stores/atoms/createAtom.js"
    "src/stores/atoms/stageAtom.js"
    "src/stores/atoms/narrativeAtom.js"
    "src/stores/atoms/qualityAtom.js"
    "src/stores/atoms/clockAtom.js"
    "src/stores/atoms/performanceAtom.js"
    "src/stores/atoms/interactionAtom.js"
    "src/stores/atoms/resourceAtom.js"
    "src/stores/atoms/index.js"
    "src/stores/narrativeStore.js"
    "src/stores/performanceStore.js"
    "src/stores/resourceStore.js"
    "src/stores/useInteractionStore.js"
)

for file in "${STATE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "\n═══════════════════════════════════════════════════════════"
        echo "📄 FILE: $file"
        echo "─────────────────────────────────────────────────────────────"
        
        # File size and last modified
        echo "📊 Stats:"
        ls -lh "$file" | awk '{print "  Size: " $5 ", Modified: " $6 " " $7 " " $8}'
        
        # Line count
        lines=$(wc -l < "$file")
        echo "  Lines: $lines"
        
        # Check if it's an atom file
        if [[ "$file" == *"Atom.js" ]]; then
            echo -e "\n⚛️ Atom Configuration:"
            grep -A3 "createAtom\|atom\." "$file" | head -10
            
            echo -e "\n🔑 Key/Default:"
            grep -E "key:|default:" "$file"
        fi
        
        # Check if it's a store file
        if [[ "$file" == *"Store.js" ]] || [[ "$file" == *"store.js" ]]; then
            echo -e "\n🏪 Store Pattern:"
            grep -E "export|create|function|const.*=" "$file" | head -5
        fi
        
        # Imports
        echo -e "\n📥 Imports:"
        grep "^import" "$file" | head -5
        
        # Exports
        echo -e "\n📤 Exports:"
        grep "^export" "$file"
        
        # Who uses this file
        echo -e "\n🔗 Used by:"
        filename=$(basename "$file")
        grep -r "$filename" src --include="*.js" --include="*.jsx" | grep -v "$file:" | cut -d: -f1 | sort | uniq | head -5
    else
        echo -e "\n❌ FILE NOT FOUND: $file"
    fi
done

# Check for atom index file
echo -e "\n═══════════════════════════════════════════════════════════"
echo "📄 ATOM INDEX FILE ANALYSIS"
echo "─────────────────────────────────────────────────────────────"

if [ -f "src/stores/atoms/index.js" ]; then
    echo "Contents of src/stores/atoms/index.js:"
    cat src/stores/atoms/index.js
else
    echo "⚠️ No index.js in atoms directory"
fi

