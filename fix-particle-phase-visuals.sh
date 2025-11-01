#!/bin/bash
# Fix PARTICLE_PHASE visual effects in WebGLBackground.jsx
# This adds the missing visual implementation to the existing listener

set -e

BACKUP_DIR=".fix-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TARGET_FILE="src/components/webgl/WebGLBackground.jsx"

echo "🔧 Fixing PARTICLE_PHASE visual effects..."

# Create backup
mkdir -p "$BACKUP_DIR"
cp "$TARGET_FILE" "$BACKUP_DIR/WebGLBackground.jsx.${TIMESTAMP}.bak"
echo "✅ Backup created: $BACKUP_DIR/WebGLBackground.jsx.${TIMESTAMP}.bak"

# Create the fix using a temporary file
cat > /tmp/particle_phase_fix.patch << 'EOF'
  // Opening sequence particle phase listener
  useEffect(() => {
    if (!BeatBus?.on || !EVENTS?.PARTICLE_PHASE) return undefined;
    const unsubscribe = BeatBus.on(EVENTS.PARTICLE_PHASE, (payload = {}) => {
      const timestamp = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      console.log('🌊 [OPENING PHASE]', {
        phase: payload?.phase,
        duration: payload?.duration,
        mode: payload?.mode,
        timestamp,
      });

      if (!blueprintBinder) {
        console.warn('⚠️ [OPENING PHASE] No binder available');
        return;
      }

      const mat = materialRef.current;
      if (!mat?.uniforms) {
        console.warn('⚠️ [OPENING PHASE] Material uniforms not available');
        return;
      }

      const duration = payload?.duration || 2000;
      const uniforms = mat.uniforms;

      switch (payload?.phase) {
        case 'chaos':
          console.log('🌪️ [CHAOS] Starting random motion');
          // Apply chaos effects
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.8;
            console.log('   Set uTurbulence = 0.8');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 1.5;
            console.log('   Set uSpeedMultiplier = 1.5');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 1; // chaos mode
            console.log('   Set uMotionMode = 1 (chaos)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 2.0;
            console.log('   Set uDriftAmp = 2.0');
          }
          mat.uniformsNeedUpdate = true;

          // Handle renderer spin if specified
          if (payload?.rendererSpin) {
            const endTime = typeof performance !== 'undefined' && performance.now
              ? performance.now() + duration
              : Date.now() + duration;
            spinRef.current = {
              active: true,
              velocity: {
                z: payload.rendererSpin.z || 0,
                y: payload.rendererSpin.y || 0,
              },
              endTime,
            };
            console.log('   Applied renderer spin:', payload.rendererSpin);
          }
          break;

        case 'coalesce':
          console.log('🌀 [COALESCE] Forming word');
          // Gradually reduce chaos
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.3;
            console.log('   Set uTurbulence = 0.3');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 1.0;
            console.log('   Set uSpeedMultiplier = 1.0');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 2; // coalesce mode
            console.log('   Set uMotionMode = 2 (coalesce)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 0.8;
            console.log('   Set uDriftAmp = 0.8');
          }
          mat.uniformsNeedUpdate = true;
          break;

        case 'settle':
          console.log('🎯 [SETTLE] Locking into form');
          // Lock particles
          if (uniforms.uTurbulence) {
            uniforms.uTurbulence.value = 0.0;
            console.log('   Set uTurbulence = 0.0');
          }
          if (uniforms.uSpeedMultiplier) {
            uniforms.uSpeedMultiplier.value = 0.5;
            console.log('   Set uSpeedMultiplier = 0.5');
          }
          if (uniforms.uMotionMode) {
            uniforms.uMotionMode.value = 3; // settle mode
            console.log('   Set uMotionMode = 3 (settle)');
          }
          if (uniforms.uDriftAmp) {
            uniforms.uDriftAmp.value = 0.2;
            console.log('   Set uDriftAmp = 0.2');
          }
          // Ensure morph is complete
          if (uniforms.uMorphProgress && uniforms.uMorphProgress.value < 1.0) {
            uniforms.uMorphProgress.value = 1.0;
            console.log('   Set uMorphProgress = 1.0');
          }
          mat.uniformsNeedUpdate = true;
          break;

        default:
          console.warn('❓ [OPENING PHASE] Unknown phase received', payload?.phase);
      }
    });

    console.log('✅ [RENDERER] PARTICLE_PHASE listener registered');

    return () => {
      console.log('🧹 [RENDERER] PARTICLE_PHASE listener cleanup');
      unsubscribe?.();
    };
  }, [blueprintBinder]);
EOF

# Apply the fix by replacing the old listener with the new one
# Find line where the listener starts and ends
START_LINE=$(grep -n "// Opening sequence particle phase listener" "$TARGET_FILE" | cut -d: -f1)
END_LINE=$(grep -n "}, \[blueprintBinder\]);" "$TARGET_FILE" | grep -A 1 "$START_LINE" | tail -1 | cut -d: -f1)

if [ -z "$START_LINE" ] || [ -z "$END_LINE" ]; then
  echo "❌ Could not find PARTICLE_PHASE listener block"
  echo "   Expected to find comment: // Opening sequence particle phase listener"
  exit 1
fi

echo "📍 Found listener at lines $START_LINE-$END_LINE"

# Create new file with replacement
{
  head -n $((START_LINE - 1)) "$TARGET_FILE"
  cat /tmp/particle_phase_fix.patch
  tail -n +$((END_LINE + 1)) "$TARGET_FILE"
} > "${TARGET_FILE}.new"

# Replace original
mv "${TARGET_FILE}.new" "$TARGET_FILE"
rm /tmp/particle_phase_fix.patch

echo "✅ Fix applied successfully!"
echo ""
echo "🧪 To test:"
echo "   1. Refresh browser (Ctrl+Shift+R)"
echo "   2. Watch opening sequence"
echo "   3. Check console for uniform value logs"
echo "   4. Verify visual particle motion changes"
echo ""
echo "🔍 Diagnostic commands:"
echo "   window.getRendererSnapshot()  // Check uniform values"
echo "   BeatBus.emit('PARTICLE_PHASE', { phase: 'chaos', duration: 2000 })  // Manual test"
echo ""
echo "↩️  To rollback:"
echo "   cp $BACKUP_DIR/WebGLBackground.jsx.${TIMESTAMP}.bak $TARGET_FILE"
