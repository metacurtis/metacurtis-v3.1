#!/bin/bash
# Consolidate debug panels - keep only Director status

cat > src/components/consciousness/ConsciousnessTheater.jsx.patch << 'EOPATCH'
@@ -350,30 +350,15 @@
-      {/* Stage HUD */}
-      <div
-        style={{
-          position: 'fixed',
-          top: '20px',
-          left: '20px',
-          color: '#00FF00',
-          fontFamily: 'Courier New, monospace',
-          fontSize: '0.9rem',
-          opacity: 0.7,
-          zIndex: 50,
-        }}
-      >
-        {stageConfig?.title} | {Math.round(scrollProgress * 100)}% | Morph:{' '}
-        {Math.round(morphProgress * 100)}%
-      </div>
+      {/* Stage HUD - DISABLED for cleaner view */}
+      {false && (
+        <div>Stage HUD disabled</div>
+      )}

       {/* Director Status (Dev only) */}
-      {import.meta.env.DEV && (
+      {import.meta.env.DEV && window.showDirectorDebug !== false && (
         <div
           style={{
             position: 'fixed',
-            top: '60px',
+            top: '20px',
             left: '20px',
             background: 'rgba(0, 0, 0, 0.8)',
             color: '#00FF00',
@@ -385,40 +370,20 @@
           <div>�� Scroll: {scrollEnabled ? '✅' : '🔒'}</div>
           <div>🎭 Narrative: {narrativeEnabled ? '✅' : '⏳'}</div>
           <div>🎨 Particles: {showCanvas ? '✅' : '⏳'}</div>
+          <div>🎯 Stage: {currentStage} ({Math.round(scrollProgress * 100)}%)</div>
+          <div>🔄 Morph: {Math.round(morphProgress * 100)}%</div>
         </div>
       )}

-      {/* Dev Performance Monitor */}
-      <DevPerformanceMonitor />
+      {/* Dev Performance Monitor - DISABLED */}
+      {false && <DevPerformanceMonitor />}

-      {/* Dev controls */}
-      {import.meta.env.DEV && scrollEnabled && (
-        <div
-          style={{
-            position: 'fixed',
-            bottom: '20px',
-            right: '20px',
-            background: 'rgba(0, 0, 0, 0.8)',
-            color: '#00FF00',
-            fontFamily: 'Courier New, monospace',
-            fontSize: '0.8rem',
-            padding: '15px',
-            borderRadius: '5px',
-            border: '1px solid #00FF00',
-            maxWidth: '300px',
-            zIndex: 100,
-          }}
-        >
-          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>🎮 SST v3.0 Controls</div>
-          <div>← → Navigate stages</div>
-          <div>↑ ↓ Manual morph</div>
-          <div>1-7 Jump to stage</div>
-          <div>Scroll for progression</div>
-          <div style={{ marginTop: '5px', color: '#ffff00' }}>
-            {morphProgress < 0.5 ? '☁️ Atmospheric' : '🧠 Brain'} Mode
-          </div>
-        </div>
+      {/* Dev controls - DISABLED */}
+      {false && (
+        <div>Controls disabled</div>
       )}
EOPATCH

patch src/components/consciousness/ConsciousnessTheater.jsx < src/components/consciousness/ConsciousnessTheater.jsx.patch

echo "✅ Consolidated debug panels - only Director status remains"
