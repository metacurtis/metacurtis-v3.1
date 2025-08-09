#!/bin/bash
# Fix particle positions to spread across viewport

cat > src/engine/ConsciousnessEngine.js.patch << 'EOPATCH'
--- a/src/engine/ConsciousnessEngine.js
+++ b/src/engine/ConsciousnessEngine.js
@@ -308,11 +308,11 @@
   textToParticlePositions(text, count) {
     const positions = new Float32Array(count * 3);
     
-    // Use viewport-relative dimensions
-    const viewportScale = 10; // Increase scale to fill viewport
-    const textWidth = text.length * 2.0 * viewportScale;
-    const textHeight = 4.0 * viewportScale;
+    // SST v3.0: Particles should fill the viewport
+    const viewportWidth = 80;  // Spread across full width
+    const viewportHeight = 40; // Spread vertically
+    const viewportDepth = 10;  // Some depth variation
     
     for (let i = 0; i < count; i++) {
-      // Distribute across full viewport
-      const x = (Math.random() - 0.5) * textWidth;
-      const y = (Math.random() - 0.5) * textHeight;
-      const z = (Math.random() - 0.5) * 2.0;
+      // Distribute particles to fill viewport
+      const x = (Math.random() - 0.5) * viewportWidth;
+      const y = (Math.random() - 0.5) * viewportHeight;
+      const z = (Math.random() - 0.5) * viewportDepth;
       
       positions[i * 3] = x;
       positions[i * 3 + 1] = y;
EOPATCH

patch src/engine/ConsciousnessEngine.js < src/engine/ConsciousnessEngine.js.patch

echo "✅ Fixed particle spread to fill viewport"
