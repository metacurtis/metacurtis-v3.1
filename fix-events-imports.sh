#!/bin/bash

echo "🔧 Fixing events.js imports..."

# Fix all incorrect imports of events.js
echo "   Updating imports to use correct path @theater/events.js"

# Fix any that incorrectly point to @components/theater/events.js
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '@components/theater/events\.js'|from '@theater/events.js'|g" {} \;

# Also fix any relative imports that might be wrong
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./\.\./theater/events\.js'|from '@theater/events.js'|g" {} \;
  
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
  "s|from '\.\./theater/events\.js'|from '@theater/events.js'|g" {} \;

# Show all files that import events.js now
echo ""
echo "✅ Fixed! Current imports of events.js:"
grep -r "import.*EVENTS.*from" src/ --include="*.js" --include="*.jsx" | grep events.js

echo ""
echo "📋 Verifying all imports are consistent:"
grep -r "from.*events\.js" src/ --include="*.js" --include="*.jsx"
