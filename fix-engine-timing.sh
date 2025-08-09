#!/bin/bash
# Fix Engine emitting blueprint before renderer is ready

sed -i 's/setTimeout(() => {/setTimeout(() => {/' src/engine/ConsciousnessEngine.js
sed -i 's/}, 100);/}, 500); \/\/ Give renderer time to mount/' src/engine/ConsciousnessEngine.js

echo "✅ Fixed Engine timing - delays initial blueprint emit to 500ms"
