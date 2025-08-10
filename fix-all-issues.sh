#!/bin/bash
# Fix all identified issues

echo "🔧 Fixing Director remount cycle..."
# Fix useEffect dependencies
sed -i 's/}, \[directorStarted, triggerFragment\]);/}, []);/' src/components/consciousness/ConsciousnessTheater.jsx

echo "🔧 Adding isRunning flag to Director..."
# Add isRunning flag to prevent multiple starts
sed -i '/this.cancelled = false;/a\    this.isRunning = false;' src/theater/TheaterDirector.js
sed -i '/async start() {/a\    if (this.isRunning) { console.log("Director: Already running"); return; }\n    this.isRunning = true;' src/theater/TheaterDirector.js
sed -i '/cancel() {/a\    if (!this.isRunning) return;\n    this.isRunning = false;' src/theater/TheaterDirector.js

echo "✅ All fixes applied"
echo "Please restart dev server: npm run dev"
