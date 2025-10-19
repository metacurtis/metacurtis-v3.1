#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🔧 FIXING STATE CONFLICTS"
echo "═══════════════════════════════════════════════════════════════"

# 1. Fix circular dependency
echo "🔴 Fixing circular dependency in utils/random.js..."
sed -i '/import.*from.*"@\/utils\/random.js"/d' src/utils/random.js

# 2. Update components to use atoms instead of stores
echo "📝 Updating components to use atoms..."

# Fix AdvancedContactPortal.jsx
sed -i 's|@/stores/narrativeStore|@/stores/atoms/narrativeAtom|g' src/components/ui/AdvancedContactPortal.jsx

# Fix MemoryFragments.jsx
sed -i 's|@/stores/narrativeStore|@/stores/atoms/narrativeAtom|g' src/components/ui/narrative/MemoryFragments.jsx

# Fix StageNavigation.jsx
sed -i 's|@/stores/narrativeStore|@/stores/atoms/narrativeAtom|g' src/components/ui/narrative/StageNavigation.jsx

# Fix ResourceMonitor.jsx
sed -i 's|@/stores/resourceStore|@/stores/atoms/resourceAtom|g' src/components/ui/ResourceMonitor.jsx

# Fix Typewriter.jsx
sed -i 's|../../stores/useInteractionStore|@/stores/atoms/interactionAtom|g' src/components/ui/Typewriter.jsx

# 3. Mark redundant stores as deprecated
echo "📌 Marking redundant stores as deprecated..."
for file in src/stores/narrativeStore.js src/stores/performanceStore.js src/stores/resourceStore.js src/stores/useInteractionStore.js; do
  if [ -f "$file" ]; then
    # Add deprecation notice at top
    echo "/* @deprecated - Use atoms instead. Will be removed in next version. */" | cat - "$file" > temp && mv temp "$file"
  fi
done

# 4. Remove unnecessary hook wrappers
echo "🗑️ Removing redundant hook wrappers..."
rm -f src/hooks/atoms/useInteractionStore.js
rm -f src/hooks/atoms/useNarrativeStore.js
rm -f src/hooks/atoms/usePerformanceStore.js
rm -f src/hooks/atoms/useResourceStore.js

echo "✅ State conflicts resolved!"

