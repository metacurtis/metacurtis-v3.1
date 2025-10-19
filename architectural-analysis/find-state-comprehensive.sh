#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 COMPREHENSIVE STATE FILE SEARCH"
echo "═══════════════════════════════════════════════════════════════"

# First, check where we are
echo "Current directory: $(pwd)"
echo "Looking for src directory..."

# Find src directory
if [ -d "src" ]; then
    echo "✓ Found src/"
elif [ -d "../src" ]; then
    cd ..
    echo "✓ Found src/ (moved up one level)"
elif [ -d "../../src" ]; then
    cd ../..
    echo "✓ Found src/ (moved up two levels)"
else
    echo "✗ Cannot find src directory"
    exit 1
fi

echo -e "\n📁 SEARCHING ALL DIRECTORIES FOR STATE FILES:"
echo "─────────────────────────────────────────────────────────────"

# Use grep to find files containing state-related code
echo -e "\nFiles containing 'atom' (case insensitive):"
grep -r -l -i "atom" src --include="*.js" --include="*.jsx" 2>/dev/null | head -20

echo -e "\nFiles containing 'StateController':"
grep -r -l "StateController" src --include="*.js" --include="*.jsx" 2>/dev/null

echo -e "\nFiles containing 'StateValidator':"
grep -r -l "StateValidator" src --include="*.js" --include="*.jsx" 2>/dev/null

echo -e "\nFiles containing 'createAtom':"
grep -r -l "createAtom" src --include="*.js" --include="*.jsx" 2>/dev/null

echo -e "\n📁 CHECKING SPECIFIC PATHS:"
echo "─────────────────────────────────────────────────────────────"

# Check each potential location
paths=(
    "src/stores"
    "src/stores/atoms"
    "src/modules/state"
    "src/modules/state/core"
    "src/modules/state/bridges"
    "src/state"
    "src/hooks/atoms"
)

for path in "${paths[@]}"; do
    if [ -d "$path" ]; then
        echo "✓ $path exists:"
        ls -la "$path" | grep -E "\.js$|\.jsx$" | awk '{print "    " $9}'
    else
        echo "✗ $path not found"
    fi
done

echo -e "\n📊 ACTUAL FILE LOCATIONS:"
echo "─────────────────────────────────────────────────────────────"

# Find actual atom files
echo "Searching for actual atom files..."
find . -path "*/node_modules" -prune -o -type f -name "*atom*.js" -print 2>/dev/null | grep -v node_modules

echo -e "\nSearching for store files..."
find . -path "*/node_modules" -prune -o -type f -name "*store*.js" -print 2>/dev/null | grep -v node_modules | head -20

echo -e "\nSearching for state files..."
find . -path "*/node_modules" -prune -o -type f -name "*state*.js" -print 2>/dev/null | grep -v node_modules | head -20

