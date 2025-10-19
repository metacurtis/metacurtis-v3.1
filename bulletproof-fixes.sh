#!/bin/bash

echo "=== Bulletproofing Fixes ==="

# 1. Check for cache key issues
echo -e "\n1. Cache Keys Using String Concatenation:"
grep -n "const key = \`\${.*}|\${.*}\`" src/engine/ConsciousnessEngine.js 2>/dev/null || echo "  None found"

# 2. Check for emergenceLockRef
echo -e "\n2. emergenceLockRef Usage:"
grep -n "emergenceLockRef" src/components/webgl/WebGLBackground.jsx 2>/dev/null || echo "  None found"

# 3. Check for CTF events
echo -e "\n3. CTF Events Present:"
grep "CTF_BUILD\|CTF_READY" src/theater/events.js 2>/dev/null && echo "  ✓ Found" || echo "  ✗ Missing"

# 4. Apply fixes if requested
if [ "$1" == "--fix" ]; then
    echo -e "\n=== Applying Fixes ==="
    
    # Add CTF events if missing
    if ! grep -q "CTF_BUILD" src/theater/events.js; then
        sed -i "/BLUEPRINT_READY/a\\
  CTF_BUILD: 'CTF_BUILD',\\
  CTF_READY: 'CTF_READY',\\
  CTF_SHOW: 'CTF_SHOW',\\
  CTF_HIDE: 'CTF_HIDE'," src/theater/events.js
        echo "  ✓ Added CTF events"
    fi
    
    echo "  Done"
else
    echo -e "\nRun with --fix to apply changes"
fi
