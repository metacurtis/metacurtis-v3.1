#!/bin/bash

# Fix AdvancedContactPortal.jsx
sed -i '6a\import { useAtom } from "@/hooks/useAtom";' src/components/ui/AdvancedContactPortal.jsx
sed -i 's/const narrative = narrativeAtom.getState();/const narrative = useAtom(narrativeAtom);/g' src/components/ui/AdvancedContactPortal.jsx

# Fix MemoryFragments.jsx
sed -i '6a\import { useAtom } from "@/hooks/useAtom";' src/components/ui/narrative/MemoryFragments.jsx
sed -i 's/const narrative = narrativeAtom.getState();/const narrative = useAtom(narrativeAtom);/g' src/components/ui/narrative/MemoryFragments.jsx

# Fix StageNavigation.jsx
sed -i '5a\import { useAtom } from "@/hooks/useAtom";' src/components/ui/narrative/StageNavigation.jsx
sed -i 's/narrativeAtom.getState()/useAtom(narrativeAtom)/g' src/components/ui/narrative/StageNavigation.jsx

echo "Components updated to use useAtom hook"
