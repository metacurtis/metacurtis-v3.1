#!/bin/bash
# Fix all visual issues for SST v3.0 compliance

echo "🔧 Fixing opening sequence timing..."
# Slower typing
sed -i 's/typeSpeed: 50/typeSpeed: 100/' src/theater/TheaterDirector.js
sed -i 's/lineDelay: 300/lineDelay: 600/' src/theater/TheaterDirector.js

echo "🔧 Fixing particle spread..."
# Fix emergence particles
sed -i 's/const viewportScale = 10;/const viewportWidth = 80;/' src/engine/ConsciousnessEngine.js
sed -i 's/const textWidth = text.length \* 2.0 \* viewportScale;/const viewportHeight = 40;/' src/engine/ConsciousnessEngine.js
sed -i 's/const textHeight = 4.0 \* viewportScale;/const viewportDepth = 10;/' src/engine/ConsciousnessEngine.js

# Fix atmospheric particle spread
sed -i 's/const r = rnd() \* 60 + 20;/const r = rnd() \* 80 + 40;/' src/engine/ConsciousnessEngine.js
sed -i 's/const brainR = 15 + rnd() \* 10;/const brainR = 20 + rnd() \* 15;/' src/engine/ConsciousnessEngine.js

echo "✅ All visual fixes applied"
echo "Please restart: npm run dev"
