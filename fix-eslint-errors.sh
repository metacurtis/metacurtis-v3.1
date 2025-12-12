#!/bin/bash

echo "🔧 Fixing ESLint errors..."

# Fix DevPerformanceMonitor - Move condition after hooks
sed -i '70,80d' src/components/dev/DevPerformanceMonitor.jsx
sed -i '70i\  // Hooks must be called before any returns\n  const [qualityState, setQualityState] = useState(qualityAtom.getState());\n  const [clockState, setClockState] = useState(clockAtom.getState());\n  const [stageState, setStageState] = useState(stageAtom.getState());\n\n  // Master disable switch - AFTER hooks\n  if (!window.ENABLE_PERFORMANCE_MONITOR) return null;' src/components/dev/DevPerformanceMonitor.jsx

# Fix ConsciousnessTheater - Remove false && statements
sed -i 's/{false && (/{\/* Disabled *\/ \/* /g' src/components/consciousness/ConsciousnessTheater.jsx
sed -i 's/<div>Stage HUD disabled<\/div>/*\//g' src/components/consciousness/ConsciousnessTheater.jsx
sed -i 's/<div>SST Controls disabled<\/div>/*\//g' src/components/consciousness/ConsciousnessTheater.jsx

# Fix WebGLCanvas - Remove false && 
sed -i 's/{false && false && import.meta.env.DEV/{\/* DISABLED *\/ false/g' src/components/webgl/WebGLCanvas.jsx

echo "✅ ESLint errors should be fixed"
