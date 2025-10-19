#!/bin/bash

echo "=== Fixing Canon Dev-OS Setup ==="

# 1. Remove old canon init from main.jsx
sed -i "/import '\.\/canon\/init-amplified\.js'/d" src/main.jsx

# 2. Add Canon Dev-OS import to main.jsx (after first line)
if ! grep -q "canon-console/browser/inject" src/main.jsx; then
  sed -i '1a\
// Import Canon Dev-OS (dev only)\
if (import.meta.env.DEV) {\
  import("/canon-console/browser/inject.js");\
}' src/main.jsx
  echo "✓ Added Canon import to main.jsx"
fi

# 3. Fix the syntax error in the injector (missing closing brace)
sed -i 's/return imp('\''runtime\/violation-tap\.js'\'', '\''vtap'\'');$/return imp('\''runtime\/violation-tap\.js'\'', '\''vtap'\''); })/' canon-console/browser/inject.js
echo "✓ Fixed injector syntax error"

# 4. Remove duplicate Canon import from App.jsx (it's now in main.jsx)
sed -i '/\/canon-console\/browser\/inject\.js/d' src/App.jsx
echo "✓ Removed duplicate Canon import from App.jsx"

# 5. Archive the conflicting L2 injector
mkdir -p canon-console/_retired
if [ -f "canon-console/runtime/inject.js" ]; then
  mv canon-console/runtime/inject.js canon-console/_retired/inject-l2.js
  echo "✓ Archived L2 injector"
fi

# 6. Verify the blueprint guard file exists
if [ -f "canon-console/runtime/blueprint-guard-v2.js" ]; then
  echo "✓ Blueprint Guard V2 exists"
else
  echo "⚠ Blueprint Guard V2 missing - Session 1 needs completion"
fi

echo ""
echo "=== Setup Complete ==="
echo "1. Run: npm run dev"
echo "2. Look for '[Canon] Injector v3.5 ready' in console"
echo "3. Press F2 to toggle HUD"
echo "4. Check: window.CANON_CONSOLE.stats()"
