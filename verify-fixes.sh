#!/bin/bash
echo "=== Verification ==="
echo -n "1. Cache key fixed: "
grep -n "const key = \`\${.*}|\${.*}\`" src/engine/ConsciousnessEngine.js 2>/dev/null && echo "NO" || echo "YES"

echo -n "2. CTF events added: "
grep -q "CTF_BUILD" src/theater/events.js && echo "YES" || echo "NO"

echo -n "3. No emergenceLockRef: "
grep -r "emergenceLockRef" src/ 2>/dev/null && echo "NO" || echo "YES"
