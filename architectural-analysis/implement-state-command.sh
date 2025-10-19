#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 IMPLEMENTING CLEAN STATE ARCHITECTURE"
echo "═══════════════════════════════════════════════════════════════"

# 1. Create state directory with proper structure
echo "📁 Creating state management structure..."
mkdir -p src/state
mkdir -p src/state/atoms
mkdir -p src/state/commands

# 2. Move existing atoms to new location
echo "📦 Moving atoms to state/atoms..."
cp -r src/stores/atoms/* src/state/atoms/

# 3. Create the State Command Layer
echo "✨ Creating State Command Layer..."
cat > src/state/commands/StateCommands.js << 'EOF'
// State Command Layer - Orchestrates complex state operations
import { batch } from '../atoms/createAtom';
import * as atoms from '../atoms';
import { BeatBus } from '@/theater/bus';
import { EVENTS } from '@/theater/events';

class StateCommands {
  constructor() {
    this.snapshots = [];
    this.morphState = null;
  }

  // Handle 3D text morphing at climax
  async executeClimaxMorph({ text, duration = 3000 }) {
    this.createSnapshot('pre-morph');
    
    batch(() => {
      atoms.narrativeAtom.set(prev => ({ ...prev, paused: true }));
      atoms.interactionAtom.set(prev => ({ ...prev, locked: true }));
    });

    this.morphState = { text, startTime: performance.now() };
    
    const animate = () => {
      const progress = Math.min((performance.now() - this.morphState.startTime) / duration, 1);
      atoms.narrativeAtom.set(prev => ({ ...prev, morphProgress: progress }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.completeMorph();
      }
    };
    
    requestAnimationFrame(animate);
  }

  completeMorph() {
    batch(() => {
      atoms.narrativeAtom.set(prev => ({ ...prev, paused: false }));
      atoms.interactionAtom.set(prev => ({ ...prev, locked: false }));
    });
    this.morphState = null;
  }

  // Memory fragment interruption
  interruptForFragment(fragment) {
    this.createSnapshot('fragment-interrupt');
    
    batch(() => {
      atoms.narrativeAtom.set(prev => ({ ...prev, paused: true }));
      atoms.interactionAtom.set(prev => ({ 
        ...prev, 
        memoryFragment: fragment,
        locked: true 
      }));
    });
    
    BeatBus.emit(EVENTS.MEMORY_FRAGMENT_START, fragment);
  }

  resumeFromFragment() {
    const snapshot = this.snapshots.find(s => s.label === 'fragment-interrupt');
    if (snapshot) this.restoreSnapshot(snapshot);
    BeatBus.emit(EVENTS.MEMORY_FRAGMENT_END);
  }

  // Stage transitions
  transitionStage(from, to) {
    batch(() => {
      atoms.stageAtom.set({ currentStage: to, transitioning: true });
      atoms.narrativeAtom.set(prev => ({ ...prev, paused: true }));
    });
    
    BeatBus.emit(EVENTS.STAGE_TRANSITION, { from, to });
  }

  createSnapshot(label) {
    this.snapshots.push({
      label,
      timestamp: Date.now(),
      state: {
        stage: atoms.stageAtom.get(),
        narrative: atoms.narrativeAtom.get(),
        quality: atoms.qualityAtom.get()
      }
    });
  }

  restoreSnapshot(snapshot) {
    batch(() => {
      atoms.stageAtom.set(snapshot.state.stage);
      atoms.narrativeAtom.set(snapshot.state.narrative);
      atoms.qualityAtom.set(snapshot.state.quality);
    });
  }
}

export default new StateCommands();
EOF

# 4. Create unified state index
echo "📝 Creating unified state index..."
cat > src/state/index.js << 'EOF'
// Unified State Management
export * from './atoms';
export { default as StateCommands } from './commands/StateCommands';
EOF

# 5. Update atom imports throughout project
echo "🔧 Updating imports..."
find src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i \
    -e 's|from ["'"'"']@/stores/atoms|from ["'"'"']@/state/atoms|g' \
    -e 's|from ["'"'"']\.\./stores/atoms|from ["'"'"']@/state/atoms|g' \
    -e 's|from ["'"'"']\.\./\.\./stores/atoms|from ["'"'"']@/state/atoms|g' \
    {} \;

# 6. Mark old files as deprecated
echo "📌 Marking old files as deprecated..."
for file in src/stores/*.js src/hooks/atoms/*.js; do
  if [ -f "$file" ]; then
    echo "/* @deprecated - Use @/state instead */" | cat - "$file" > temp && mv temp "$file"
  fi
done

echo "✅ State architecture implemented!"
echo ""
echo "Next steps:"
echo "1. Test the build: npm run build"
echo "2. Remove deprecated files after testing"
echo "3. Update components to use StateCommands"

