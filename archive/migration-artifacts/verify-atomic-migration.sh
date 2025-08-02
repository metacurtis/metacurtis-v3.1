#!/bin/bash
# Verification script for atomic migration

echo "🔍 Verifying Atomic Migration..."
echo "================================"

# Check if atomic stores exist
echo ""
echo "Checking atomic stores..."
for store in narrativeAtom performanceAtom interactionAtom resourceAtom; do
    if [ -f "src/stores/atoms/${store}.js" ]; then
        echo "✅ ${store}.js exists"
    else
        echo "❌ ${store}.js missing!"
    fi
done

# Check if compatibility hooks exist
echo ""
echo "Checking compatibility hooks..."
for hook in useNarrativeStore usePerformanceStore useInteractionStore useResourceStore; do
    if [ -f "src/hooks/atoms/${hook}.js" ]; then
        echo "✅ ${hook}.js exists"
    else
        echo "❌ ${hook}.js missing!"
    fi
done

# Check if wrapper stores exist
echo ""
echo "Checking wrapper stores..."
for store in narrativeStore performanceStore useInteractionStore resourceStore; do
    if [ -f "src/stores/${store}.js" ]; then
        echo "✅ ${store}.js exists"
    else
        echo "❌ ${store}.js missing!"
    fi
done

# Check for zustand imports
echo ""
echo "Checking for remaining zustand imports..."
if grep -r "from 'zustand'" src/ --include="*.js" --include="*.jsx" 2>/dev/null; then
    echo "❌ Found zustand imports!"
else
    echo "✅ No zustand imports found"
fi

# Check package.json
echo ""
echo "Checking package.json..."
if grep -q '"zustand"' package.json 2>/dev/null; then
    echo "❌ zustand still in package.json!"
else
    echo "✅ zustand removed from package.json"
fi

echo ""
echo "✨ Migration verification complete!"
