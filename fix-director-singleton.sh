#!/bin/bash
# Ensure Director is a true singleton

cat > src/theater/TheaterDirector.js.patch << 'EOPATCH'
@@ -1,6 +1,8 @@
 class TheaterDirector {
   constructor() {
     this.phase = 'idle';
     this.cancelled = false;
+    this.isRunning = false;
+    this.startPromise = null;
   }
   
   async start() {
+    if (this.isRunning || this.startPromise) {
+      console.log('🎬 Director: Already running or starting');
+      return this.startPromise;
+    }
EOPATCH

patch src/theater/TheaterDirector.js < src/theater/TheaterDirector.js.patch

echo "✅ Fixed Director singleton"
