#!/bin/bash

echo "🔧 Converting all imports to absolute paths..."

# Fix BeatBus imports
echo "   Fixing BeatBus imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|import BeatBus from.*BeatBus\.js.*|import BeatBus from '@modules/orchestration/core/BeatBus';|g" {} \;

# Fix store imports
echo "   Fixing store imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./stores/atoms/|from '@stores/atoms/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./stores/atoms/|from '@stores/atoms/|g" {} \;

# Fix config imports
echo "   Fixing config imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./config/canonical/|from '@config/canonical/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./config/canonical/|from '@config/canonical/|g" {} \;

# Fix component imports
echo "   Fixing component imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./webgl/|from '@components/webgl/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./dev/|from '@components/dev/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./theater/|from '@components/theater/|g" {} \;

# Fix engine imports
echo "   Fixing engine imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./engine/|from '@engine/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./engine/|from '@engine/|g" {} \;

# Fix theater imports
echo "   Fixing theater imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./theater/|from '@theater/|g" {} \;
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./theater/|from '@theater/|g" {} \;

# Fix hooks imports
echo "   Fixing hooks imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./hooks/|from '@hooks/|g" {} \;

# Fix utils imports
echo "   Fixing utils imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./utils/|from '@utils/|g" {} \;

echo "✅ All imports converted to absolute paths"

# Show a sample of the changes
echo ""
echo "📋 Sample of updated imports:"
grep -h "^import.*from '@" src/components/consciousness/ConsciousnessTheater.jsx | head -5
grep -h "^import.*from '@" src/engine/ConsciousnessEngine.js | head -5
