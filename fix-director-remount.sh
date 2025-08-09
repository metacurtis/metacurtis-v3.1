#!/bin/bash
# Fix the infinite Director remount issue

cat > src/components/consciousness/ConsciousnessTheater.jsx.patch << 'EOPATCH'
--- a/src/components/consciousness/ConsciousnessTheater.jsx
+++ b/src/components/consciousness/ConsciousnessTheater.jsx
@@ -154,7 +154,7 @@
   // ===== DIRECTOR INTEGRATION =====
   useEffect(() => {
     console.log('🎭 ConsciousnessTheater: Starting Director-controlled experience');
     
     // Start Director if not already started
     if (!directorStarted) {
       director.start();
@@ -194,7 +194,7 @@
       handlers.forEach(off => off && off());
       document.body.style.overflow = '';
     };
-  }, [directorStarted, triggerFragment]);
+  }, []); // Remove dependencies to prevent remounting

EOPATCH

# Apply the patch
patch src/components/consciousness/ConsciousnessTheater.jsx < src/components/consciousness/ConsciousnessTheater.jsx.patch

echo "✅ Fixed Director remount cycle"
