#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 FINDING ALL STATE-RELATED FILES"
echo "═══════════════════════════════════════════════════════════════"

# Search everywhere for state-related files
echo -e "\n📁 ALL STATE/ATOM/STORE FILES:"
echo "─────────────────────────────────────────────────────────────"

# Find by filename patterns
find src -type f \( \
    -name "*state*" -o \
    -name "*State*" -o \
    -name "*atom*" -o \
    -name "*Atom*" -o \
    -name "*store*" -o \
    -name "*Store*" -o \
    -name "*controller*" -o \
    -name "*Controller*" -o \
    -name "*command*" -o \
    -name "*Command*" \
\) \( -name "*.js" -o -name "*.jsx" \) | sort | while read file; do
    echo "📄 $file"
    # Show first line to identify purpose
    head -1 "$file" | grep -E "^//" && echo ""
done

echo -e "\n📁 MODULES/STATE DIRECTORY:"
echo "─────────────────────────────────────────────────────────────"
if [ -d "src/modules/state" ]; then
    find src/modules/state -type f -name "*.js" | sort
else
    echo "Directory not found"
fi

echo -e "\n📁 STORES DIRECTORY:"
echo "─────────────────────────────────────────────────────────────"
if [ -d "src/stores" ]; then
    find src/stores -type f -name "*.js" | sort
else
    echo "Directory not found"
fi

echo -e "\n📁 HOOKS WITH STATE:"
echo "─────────────────────────────────────────────────────────────"
find src/hooks -type f -name "*.js" | xargs grep -l "atom\|store\|state" 2>/dev/null | sort

echo -e "\n📊 STATE IMPORT ANALYSIS:"
echo "─────────────────────────────────────────────────────────────"

echo -e "\nFiles importing from stores/atoms:"
grep -r "from.*stores/atoms" src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq | wc -l
echo "files"

echo -e "\nFiles importing from modules/state:"
grep -r "from.*modules/state" src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq | wc -l
echo "files"

echo -e "\nFiles importing StateController:"
grep -r "StateController" src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq

echo -e "\nFiles importing StateValidator:"
grep -r "StateValidator" src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq

