
# State Management Analysis Report

## Atoms (9 files)
- **clockAtom**: Used by 5 files
- **createAtom**: Used by 12 files
- **index**: Used by 19 files
- **interactionAtom**: Used by 3 files
- **narrativeAtom**: Used by 5 files
- **performanceAtom**: Used by 3 files
- **qualityAtom**: Used by 8 files
- **resourceAtom**: Used by 3 files
- **stageAtom**: Used by 6 files

## Stores (4 files)
- **narrativeStore**: Used by 5 files
- **performanceStore**: Used by 1 files
- **resourceStore**: Used by 2 files
- **useInteractionStore**: Used by 3 files

## Conflicts (16 files)
- components/consciousness/ConsciousnessTheater.jsx: Uses atom, useState
- components/dev/DevPerformanceMonitor.jsx: Uses atom, useState
- components/ui/AdvancedContactPortal.jsx: Uses store, useState
- components/ui/Typewriter.jsx: Uses store, useState
- components/ui/narrative/MemoryFragments.jsx: Uses store, useState
- hooks/atoms/useInteractionStore.js: Uses atom, store
- hooks/atoms/useNarrativeStore.js: Uses atom, store
- hooks/atoms/usePerformanceStore.js: Uses atom, store
- hooks/atoms/useResourceStore.js: Uses atom, store
- hooks/useAdaptiveQuality.js: Uses atom, useState
- stores/atoms/createAtom.js: Uses atom, store
- stores/narrativeStore.js: Uses atom, store
- stores/performanceStore.js: Uses atom, store
- stores/resourceStore.js: Uses atom, store
- stores/useInteractionStore.js: Uses atom, store
- utils/featureFlags.js: Uses atom, store

## Recommendations
- Remove redundant store: narrativeStore (use narrativeAtom instead)
- Remove redundant store: performanceStore (use performanceAtom instead)
- Remove redundant store: resourceStore (use resourceAtom instead)
