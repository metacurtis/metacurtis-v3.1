#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🧹 REMOVING CTF AND BRAIN POSITION SYSTEMS"
echo "═══════════════════════════════════════════════════════════════"

# Phase 1: Delete files
echo "📁 Phase 1: Removing obsolete files..."

# Remove brain-related files
[ -f "src/components/webgl/consciousness/ConsciousnessPatterns.js" ] && rm -v src/components/webgl/consciousness/ConsciousnessPatterns.js
[ -f "src/engine/FormationResolver.js" ] && rm -v src/engine/FormationResolver.js

# Remove CTF files
[ -f "src/components/webgl/CTFOverlay.jsx" ] && rm -v src/components/webgl/CTFOverlay.jsx
[ -f "src/components/webgl/CTFOverlay2.jsx" ] && rm -v src/components/webgl/CTFOverlay2.jsx
[ -d "src/ctf" ] && rm -rf src/ctf && echo "Removed src/ctf directory"

# Phase 2: Clean ConsciousnessEngine.js
echo -e "\n🔧 Phase 2: Cleaning ConsciousnessEngine.js..."

# Remove imports
sed -i '/import.*ConsciousnessPatterns/d' src/engine/ConsciousnessEngine.js
sed -i '/import.*FormationResolver/d' src/engine/ConsciousnessEngine.js
sed -i '/import.*generateBrainRegionPositions/d' src/engine/ConsciousnessEngine.js

# Remove CTF_BUILD listener (multiline removal)
sed -i '/CTF_BUILD/,/});/d' src/engine/ConsciousnessEngine.js

# Remove resolver properties
sed -i '/this\.resolver/d' src/engine/ConsciousnessEngine.js
sed -i '/this\.resolverReady/d' src/engine/ConsciousnessEngine.js

# Replace allenAtlasPositions with text3DPositions
sed -i 's/allenAtlasPositions/text3DPositions/g' src/engine/ConsciousnessEngine.js
sed -i 's/allenAtlasPosition/text3DPosition/g' src/engine/ConsciousnessEngine.js

# Phase 3: Clean WebGLBackground.jsx
echo "🎨 Phase 3: Cleaning WebGLBackground.jsx..."

sed -i '/CTF_READY/,/});/d' src/components/webgl/WebGLBackground.jsx
sed -i 's/allenAtlasPosition/text3DPosition/g' src/components/webgl/WebGLBackground.jsx
sed -i 's/allenAtlasPositions/text3DPositions/g' src/components/webgl/WebGLBackground.jsx

# Phase 4: Clean TheaterDirector.js
echo "🎬 Phase 4: Cleaning TheaterDirector.js..."

sed -i '/CTF_BUILD/d' src/theater/TheaterDirector.js
sed -i '/CTF_HIDE/d' src/theater/TheaterDirector.js
sed -i '/CTF_READY/d' src/theater/TheaterDirector.js

# Phase 5: Clean WebGLCanvas.jsx
echo "🖼️ Phase 5: Cleaning WebGLCanvas.jsx..."

sed -i '/import.*CTFOverlay/d' src/components/webgl/WebGLCanvas.jsx
sed -i '/<CTFOverlay/d' src/components/webgl/WebGLCanvas.jsx

# Remove test CTF emission block
sed -i '/\/\/ Test CTF after delay/,/}, 3000);/d' src/components/webgl/WebGLCanvas.jsx

# Phase 6: Clean events.js
echo "📢 Phase 6: Cleaning events.js..."

sed -i '/CTF_BUILD/d' src/theater/events.js
sed -i '/CTF_READY/d' src/theater/events.js
sed -i '/CTF_HIDE/d' src/theater/events.js

# Phase 7: Update all shaders
echo "🔮 Phase 7: Updating shaders..."

# Find and update all shader files
find src -type f \( -name "*.glsl" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  -e 's/allenAtlasPosition/text3DPosition/g' \
  -e 's/brainPosition/text3DPosition/g' \
  -e 's/brainRegion/textFormation/g' {} \;

# Phase 8: Remove any brain-specific uniforms from shader strings
echo "🧬 Phase 8: Cleaning shader strings..."

# Remove brain-specific uniform declarations
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  -e '/uniform.*brain/Id' \
  -e '/uniform.*atlas/Id' {} \;

# Phase 9: Clean up any remaining references
echo "🔍 Phase 9: Final cleanup..."

# Remove any remaining CTF references
grep -r "CTF" src --include="*.js" --include="*.jsx" | grep -v "console.log" | cut -d: -f1 | sort -u | while read file; do
  sed -i '/CTF/d' "$file"
done

# Remove any remaining brain references (but keep "brainstorm" and similar words)
grep -r "brain[A-Z]" src --include="*.js" --include="*.jsx" | cut -d: -f1 | sort -u | while read file; do
  sed -i 's/brain[A-Z]/text/g' "$file"
done

echo -e "\n✅ Cleanup complete!"

# Phase 10: Verify cleanup
echo -e "\n📊 Verification:"
echo "Checking for remaining CTF references..."
CTF_COUNT=$(grep -r "CTF" src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
echo "  CTF references remaining: $CTF_COUNT"

echo "Checking for remaining brain position references..."
BRAIN_COUNT=$(grep -r "brainPosition\|allenAtlas" src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
echo "  Brain position references remaining: $BRAIN_COUNT"

# Test build
echo -e "\n🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful! Cleanup complete."
else
  echo "⚠️ Build failed. Check for remaining issues."
fi

echo "═══════════════════════════════════════════════════════════════"
echo "🎉 OLD SYSTEMS REMOVED - TEXT FORMATION SYSTEM READY"
echo "═══════════════════════════════════════════════════════════════"

