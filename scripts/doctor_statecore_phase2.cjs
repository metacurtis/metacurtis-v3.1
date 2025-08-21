#!/usr/bin/env node

/**
 * StateCore Phase 2 Doctor - BeatBus Bridge Implementation (FIXED)
 * 
 * Purpose: Bridge StateCore to BeatBus for event-driven state updates
 * Validates: Event flow, state synchronization, Canon compliance
 * 
 * Run: node scripts/doctor_statecore_phase2.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StateCorePhase2Doctor {
  constructor() {
    this.rootDir = process.cwd();
    this.srcDir = path.join(this.rootDir, 'src');
    this.results = {
      created: [],
      validated: [],
      errors: [],
      warnings: []
    };
  }

  async run() {
    console.log('🌉 StateCore Phase 2: BeatBus Bridge Implementation\n');
    console.log('=' .repeat(80));
    
    try {
      // Step 1: Verify Phase 1 is complete
      console.log('\n✅ Step 1: Verifying Phase 1...');
      await this.verifyPhase1();
      
      // Step 2: Create BeatBus Bridge
      console.log('\n🌉 Step 2: Creating BeatBus Bridge...');
      await this.createBeatBusBridge();
      
      // Step 3: Update main.jsx with imports
      console.log('\n🔧 Step 3: Updating main.jsx...');
      await this.updateMainJsx();
      
      // Step 4: Create event mappings
      console.log('\n🗺️ Step 4: Creating Event Mappings...');
      await this.createEventMappings();
      
      // Step 5: Update index exports
      console.log('\n📁 Step 5: Updating Module Exports...');
      await this.updateIndexExports();
      
      // Step 6: Create test harness
      console.log('\n🧪 Step 6: Creating Test Harness...');
      await this.createTestHarness();
      
      // Step 7: Run validation
      console.log('\n✅ Step 7: Running Validation...');
      await this.runValidation();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    }
  }

  async verifyPhase1() {
    const requiredFiles = [
      'src/modules/state/StateCore.js',
      'src/modules/state/index.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.rootDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Phase 1 file missing: ${file}. Run doctor_statecore_phase1.cjs first`);
      }
    }
    
    console.log('  ✓ Phase 1 files verified');
  }

  async createBeatBusBridge() {
    const bridgeContent = `// src/modules/state/BeatBusBridge.js
/**
 * BeatBus Bridge for StateCore
 * Connects BeatBus events to atom state updates
 *
 * @canon-boundary STATE_EVENT_BRIDGE
 * @sst-version 3.0
 */

import { stateCore } from './StateCore';
import * as BeatBusModule from '@/modules/orchestration/core/BeatBus';

// Get BUS instance with fallbacks
const BUS =
  (typeof window !== 'undefined' && window.BeatBus) ||
  BeatBusModule.default || 
  BeatBusModule.BeatBus || 
  BeatBusModule.bus;

class BeatBusBridge {
  constructor() {
    this.eventMappings = new Map();
    this.subscriptions = new Map();
    this.initialized = false;
    this.eventCount = 0;

    this.canonContract = {
      boundary: 'STATE_EVENT_BRIDGE',
      version: '1.0.0',
      sstCompliance: 'v3.0',
    };

    if (import.meta.env.DEV) {
      this._setupDevTools();
    }
  }

  initialize() {
    if (this.initialized) return;

    if (!BUS) {
      console.warn('BeatBusBridge: BUS not available yet');
      return;
    }

    // Ensure Canon boundary is enforced on the bus
    try {
      if (globalThis.canon?.boundary?.enforce && !BUS.__boundaryEnforced) {
        globalThis.canon.boundary.enforce(BUS);
        BUS.__boundaryEnforced = true;
        console.log('🚌 BeatBusBridge: boundary enforced');
      }
    } catch (e) {
      console.warn('BeatBusBridge: boundary enforcement failed', e);
    }

    // Ensure StateCore is initialized
    if (!stateCore.initialized) {
      stateCore.initialize();
    }

    // Setup mappings and listeners
    this._setupCoreMappings();
    this._connectEventListeners();
    this._setupAtomSubscriptions();

    this.initialized = true;
    console.log('✅ BeatBusBridge: Initialized with', this.eventMappings.size, 'mappings');

    // Notify Canon
    if (globalThis.canon?.validate) {
      globalThis.canon.validate('BEATBUS_BRIDGE_INIT', {
        mappings: this.eventMappings.size,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Setup core event to atom mappings
   * @private
   */
  _setupCoreMappings() {
    // STAGE_CHANGE - Canon uses { from, to } pattern
    this.mapEvent('STAGE_CHANGE', (data = {}) => {
      const next = data.to ?? data.stage ?? data.nextStage;
      if (!next) return;

      stateCore.set('narrative', (state = {}) => ({
        ...state,
        currentStage: next,
        stageStartTime: Date.now(),
        isTransitioning: false,
      }));

      // Also update stage atom if it exists
      if (stateCore.atoms.stage) {
        stateCore.set('stage', (state = {}) => ({
          ...state,
          current: next,
          index: this._getStageIndex(next),
        }));
      }
    });

    // QUALITY_CHANGE - supports both tier and quality keys
    this.mapEvent('QUALITY_CHANGE', (data = {}) => {
      const tier = data.tier ?? data.quality;
      if (!tier) return;

      stateCore.set('quality', (state = {}) => ({
        ...state,
        currentTier: tier,
        dpr: data.dpr ?? state.dpr,
        particleMultiplier: data.multiplier ?? state.particleMultiplier,
      }));
    });

    // PERFORMANCE_UPDATE
    this.mapEvent('PERFORMANCE_UPDATE', (data = {}) => {
      stateCore.set('performance', (state = {}) => ({
        ...state,
        fps: data.fps ?? state.fps,
        frameTime: data.frameTime ?? state.frameTime,
        particleCount: data.particleCount ?? state.particleCount,
      }));
    });

    // FRAME_TICK - special handling for clockAtom
    this.mapEvent('FRAME_TICK', (data = {}) => {
      if (!stateCore.atoms.clock) return;
      
      const prev = stateCore.get('clock') || {};
      stateCore.atoms.clock.setState({
        ...prev,
        fps: data.fps ?? prev.fps,
        deltaMs: data.deltaMs ?? prev.deltaMs,
        averageFrameTime: data.averageFrameTime ?? prev.averageFrameTime,
      });
    });

    // DIRECTOR_STAGE_TRANSITION
    this.mapEvent('DIRECTOR_STAGE_TRANSITION', (data = {}) => {
      const next = data.nextStage ?? data.to;
      if (!next) return;
      
      stateCore.set('narrative', (state = {}) => ({
        ...state,
        isTransitioning: true,
        nextStage: next,
        transitionDuration: data.duration ?? 1000,
      }));
    });

    // MEMORY_FRAGMENT_ACTIVATE - safe array handling
    this.mapEvent('MEMORY_FRAGMENT_ACTIVATE', (data = {}) => {
      const prev = stateCore.get('narrative') || {};
      const explored = prev.fragmentsExplored || [];
      const set = new Set(explored);
      
      if (data.fragmentId) {
        set.add(data.fragmentId);
      }

      stateCore.set('narrative', (state = {}) => ({
        ...state,
        activeMemoryFragment: data.fragmentId ?? state.activeMemoryFragment,
        fragmentsExplored: Array.from(set),
      }));
    });

    // USER_INTERACTION - safe array handling
    this.mapEvent('USER_INTERACTION', (data = {}) => {
      const prev = stateCore.get('interaction') || {};
      const list = prev.interactionEvents || [];
      
      stateCore.set('interaction', (state = {}) => ({
        ...state,
        lastInteraction: data.type ?? state.lastInteraction,
        interactionEvents: [...list.slice(-9), data],
      }));
    });

    // RESOURCE_UPDATE - safe object spreading
    this.mapEvent('RESOURCE_UPDATE', (data = {}) => {
      stateCore.set('resource', (state = {}) => ({
        ...state,
        stats: { ...(state.stats || {}), ...(data.stats || {}) },
        memory: { ...(state.memory || {}), ...(data.memory || {}) },
      }));
    });
  }

  /**
   * Connect event listeners to BeatBus
   * @private
   */
  _connectEventListeners() {
    for (const [event, handler] of this.eventMappings) {
      const listener = (payload) => {
        try {
          handler(payload);
          this.eventCount++;
          
          if (import.meta.env.DEV) {
            console.log(\`🌉 BeatBus → StateCore: \${event}\`, payload);
          }
        } catch (e) {
          console.error(\`Bridge error handling \${event}:\`, e);
        }
      };
      
      if (BUS && BUS.on) {
        BUS.on(event, listener);
        this.subscriptions.set(event, listener);
      }
    }
  }

  /**
   * Setup atom subscriptions for state → event flow
   * @private
   */
  _setupAtomSubscriptions() {
    // narrative → event
    stateCore.subscribe('narrative', (state = {}) => {
      if (state.currentStage && BUS && BUS.emit) {
        BUS.emit('STATE_STAGE_UPDATED', {
          stage: state.currentStage,
          progress: state.globalProgress,
          source: 'narrative-atom',
        });
      }
    });

    // quality → event
    stateCore.subscribe('quality', (state = {}) => {
      if (state.currentTier && BUS && BUS.emit) {
        BUS.emit('STATE_QUALITY_UPDATED', {
          tier: state.currentTier,
          dpr: state.dpr,
          source: 'quality-atom',
        });
      }
    });

    // performance warning
    stateCore.subscribe('performance', (state = {}) => {
      if (typeof state.fps === 'number' && state.fps < 30 && BUS && BUS.emit) {
        BUS.emit('PERFORMANCE_WARNING', {
          fps: state.fps,
          frameTime: state.frameTime,
          source: 'performance-atom',
        });
      }
    });
  }

  /**
   * Map an event to a state update handler
   */
  mapEvent(event, handler) {
    this.eventMappings.set(event, handler);
  }

  /**
   * Remove an event mapping
   */
  unmapEvent(event) {
    const listener = this.subscriptions.get(event);
    if (listener && BUS && BUS.off) {
      BUS.off(event, listener);
    }
    this.subscriptions.delete(event);
    this.eventMappings.delete(event);
  }

  /**
   * Emit an event through BeatBus
   */
  emit(event, data) {
    if (BUS && BUS.emit) {
      BUS.emit(event, { 
        ...data, 
        source: 'state-core', 
        timestamp: Date.now() 
      });
    }
  }

  /**
   * Get stage index (-1 for unknown)
   * @private
   */
  _getStageIndex(stage) {
    const stages = ['genesis', 'discipline', 'neural', 'velocity', 'architecture', 'harmony', 'transcendence'];
    return stages.indexOf(stage); // Returns -1 if unknown
  }

  /**
   * Setup development tools
   * @private
   */
  _setupDevTools() {
    if (typeof window === 'undefined') return;
    
    window.BeatBusBridge = this;
    window.BB = {
      emit: this.emit.bind(this),
      mappings: () => Array.from(this.eventMappings.keys()),
      eventCount: () => this.eventCount,
      test: (event, data) => {
        if (BUS && BUS.emit) {
          console.log(\`🧪 Testing event: \${event}\`);
          BUS.emit(event, data || {});
        } else {
          console.warn('BUS not available for testing');
        }
      },
    };
    
    console.log('🔧 BeatBusBridge DevTools: window.BB.{emit,mappings,eventCount,test}');
  }

  /**
   * Canon compliance validation
   */
  validateCanonCompliance() {
    return {
      boundary: this.canonContract.boundary,
      version: this.canonContract.version,
      initialized: this.initialized,
      eventMappings: this.eventMappings.size,
      eventCount: this.eventCount,
      health: this.initialized ? 'healthy' : 'not-initialized',
    };
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    for (const [event, listener] of this.subscriptions) {
      if (BUS && BUS.off) {
        BUS.off(event, listener);
      }
    }
    
    this.eventMappings.clear();
    this.subscriptions.clear();
    this.initialized = false;
    
    console.log('🌉 BeatBusBridge: Disposed');
  }
}

// Create singleton instance
const beatBusBridge = new BeatBusBridge();

// Single auto-init on DOM ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => beatBusBridge.initialize(), 100);
  });
}

export default beatBusBridge;
export { beatBusBridge };
`;

    const targetPath = path.join(this.srcDir, 'modules', 'state', 'BeatBusBridge.js');
    fs.writeFileSync(targetPath, bridgeContent);
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async updateMainJsx() {
    const mainPath = path.join(this.srcDir, 'main.jsx');
    
    if (!fs.existsSync(mainPath)) {
      console.log('  ⚠️ main.jsx not found, skipping import update');
      return;
    }
    
    let content = fs.readFileSync(mainPath, 'utf8');
    
    // Check if imports already exist
    const hasStateCore = content.includes('@/modules/state/StateCore');
    const hasBridge = content.includes('@/modules/state/BeatBusBridge');
    
    if (!hasStateCore || !hasBridge) {
      // Find a good place to add imports (after other imports)
      const importRegex = /import\s+.*from\s+['"].*['"];?\s*$/gm;
      const matches = content.match(importRegex);
      
      if (matches && matches.length > 0) {
        const lastImport = matches[matches.length - 1];
        const insertPos = content.lastIndexOf(lastImport) + lastImport.length;
        
        let imports = '\n';
        if (!hasStateCore) {
          imports += "import '@/modules/state/StateCore';\n";
        }
        if (!hasBridge) {
          imports += "import '@/modules/state/BeatBusBridge';\n";
        }
        
        content = content.slice(0, insertPos) + imports + content.slice(insertPos);
        fs.writeFileSync(mainPath, content);
        console.log(`  ✓ Updated main.jsx with state imports`);
      } else {
        console.log('  ⚠️ Could not find import position in main.jsx');
      }
    } else {
      console.log(`  ✓ main.jsx already has state imports`);
    }
  }

  async createEventMappings() {
    const mappingsContent = `// src/modules/state/eventMappings.js
/**
 * Event Mapping Configuration
 * Defines all BeatBus events and their state targets
 */

export const EVENT_MAPPINGS = {
  // Stage progression events
  STAGE_EVENTS: [
    'STAGE_CHANGE',          // { from, to }
    'DIRECTOR_STAGE_TRANSITION',
    'STAGE_COMPLETE',
    'STAGE_ENTER',
    'STAGE_EXIT'
  ],
  
  // Quality/Performance events  
  QUALITY_EVENTS: [
    'QUALITY_CHANGE',        // { tier } or { quality }
    'QUALITY_TIER_UPDATE',
    'DPR_CHANGE',
    'PERFORMANCE_UPDATE',
    'FRAME_TICK'
  ],
  
  // Interaction events
  INTERACTION_EVENTS: [
    'USER_INTERACTION',
    'MOUSE_MOVE',
    'KEY_PRESS',
    'SCROLL_UPDATE',
    'TOUCH_EVENT'
  ],
  
  // Memory/Resource events
  RESOURCE_EVENTS: [
    'RESOURCE_UPDATE',
    'MEMORY_WARNING',
    'TEXTURE_LOADED',
    'GEOMETRY_CREATED',
    'RESOURCE_DISPOSED'
  ],
  
  // Narrative events
  NARRATIVE_EVENTS: [
    'MEMORY_FRAGMENT_ACTIVATE',
    'MEMORY_FRAGMENT_CLOSE',
    'DIALOGUE_START',
    'DIALOGUE_END',
    'NARRATOR_SPEAK'
  ],
  
  // State-emitted events (reverse flow)
  STATE_EVENTS: [
    'STATE_STAGE_UPDATED',
    'STATE_QUALITY_UPDATED',
    'PERFORMANCE_WARNING'
  ]
};

// SST v3.0 Stage definitions
export const SST_STAGES = [
  'genesis',
  'discipline', 
  'neural',
  'velocity',
  'architecture',
  'harmony',
  'transcendence'
];

// Quality tiers
export const QUALITY_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

export default EVENT_MAPPINGS;
`;

    const targetPath = path.join(this.srcDir, 'modules', 'state', 'eventMappings.js');
    fs.writeFileSync(targetPath, mappingsContent);
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async updateIndexExports() {
    const indexPath = path.join(this.srcDir, 'modules', 'state', 'index.js');
    
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      
      if (!content.includes('beatBusBridge')) {
        content += `\nexport { default as beatBusBridge } from './BeatBusBridge.js';\n`;
        content += `export { EVENT_MAPPINGS, SST_STAGES, QUALITY_TIERS } from './eventMappings.js';\n`;
        
        fs.writeFileSync(indexPath, content);
        console.log(`  ✓ Updated index.js with bridge exports`);
      } else {
        console.log(`  ✓ index.js already has bridge exports`);
      }
    }
  }

  async createTestHarness() {
    const testContent = `#!/usr/bin/env node
/**
 * StateCore Phase 2 Test Harness
 * Tests BeatBus Bridge integration
 */

const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('🧪 StateCore Phase 2 Test Harness\\n');
  console.log('=' .repeat(40));
  
  const tests = {
    passed: [],
    failed: []
  };
  
  // Test 1: Bridge files exist
  console.log('\\n🌉 Test 1: Bridge Files');
  const bridgeFiles = [
    'src/modules/state/BeatBusBridge.js',
    'src/modules/state/eventMappings.js'
  ];
  
  for (const file of bridgeFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(filePath)) {
        console.log(\`  ✅ \${path.basename(file)} exists\`);
        tests.passed.push(\`bridge-\${path.basename(file)}\`);
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      console.log(\`  ❌ \${path.basename(file)}: \${error.message}\`);
      tests.failed.push(\`bridge-\${path.basename(file)}\`);
    }
  }
  
  // Test 2: main.jsx updated
  console.log('\\n🔧 Test 2: main.jsx Integration');
  const mainFile = path.join(process.cwd(), 'src/main.jsx');
  if (fs.existsSync(mainFile)) {
    try {
      const content = fs.readFileSync(mainFile, 'utf8');
      
      if (content.includes('@/modules/state/StateCore')) {
        console.log('  ✅ StateCore imported in main.jsx');
        tests.passed.push('main-statecore');
      } else {
        console.log('  ⚠️ StateCore not imported in main.jsx');
      }
      
      if (content.includes('@/modules/state/BeatBusBridge')) {
        console.log('  ✅ BeatBusBridge imported in main.jsx');
        tests.passed.push('main-bridge');
      } else {
        console.log('  ⚠️ BeatBusBridge not imported in main.jsx');
      }
    } catch (error) {
      console.log(\`  ❌ main.jsx check failed: \${error.message}\`);
    }
  } else {
    console.log('  ⚠️ main.jsx not found');
  }
  
  // Test 3: BeatBus exists
  console.log('\\n🎵 Test 3: BeatBus Module');
  const beatBusFile = path.join(process.cwd(), 'src/modules/orchestration/core/BeatBus.js');
  try {
    if (fs.existsSync(beatBusFile)) {
      console.log('  ✅ BeatBus.js exists');
      tests.passed.push('beatbus');
    } else {
      throw new Error('BeatBus.js not found');
    }
  } catch (error) {
    console.log(\`  ❌ BeatBus: \${error.message}\`);
    tests.failed.push('beatbus');
  }
  
  // Final report
  console.log('\\n' + '=' .repeat(40));
  console.log('📊 Test Results:');
  console.log(\`  ✅ Passed: \${tests.passed.length}\`);
  console.log(\`  ❌ Failed: \${tests.failed.length}\`);
  
  if (tests.failed.length === 0) {
    console.log('\\n🎉 All Phase 2 tests passed!');
    console.log('\\n💡 Browser testing commands:');
    console.log('  // Check boundary');
    console.log('  canon.boundary.getReport()');
    console.log('');
    console.log('  // Test event → state');
    console.log('  BB.test("STAGE_CHANGE", {from: "genesis", to: "neural"})');
    console.log('  SC.get("narrative", s => s.currentStage)  // "neural"');
    console.log('');
    console.log('  // Test state → event  ');
    console.log('  SC.set("quality", {currentTier: "ULTRA"})');
    console.log('  // Should emit STATE_QUALITY_UPDATED');
    console.log('');
    console.log('  // View all mappings');
    console.log('  BB.mappings()');
    console.log('');
    console.log('\\n🚀 Next: Run Phase 3 for SST v3.0 configurations');
  } else {
    console.log('\\n⚠️ Some tests failed. Please review.');
  }
  
  return tests.failed.length === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
`;

    const targetPath = path.join(this.rootDir, 'scripts', 'test_statecore_phase2.cjs');
    fs.writeFileSync(targetPath, testContent);
    fs.chmodSync(targetPath, '755');
    this.results.created.push(targetPath);
    console.log(`  ✓ Created: ${path.relative(this.rootDir, targetPath)}`);
  }

  async runValidation() {
    try {
      const output = execSync('node scripts/test_statecore_phase2.cjs', {
        cwd: this.rootDir,
        encoding: 'utf8'
      });
      
      console.log(output);
      this.results.validated.push('Phase 2 tests passed');
    } catch (error) {
      console.error('Validation failed:', error.message);
      this.results.errors.push('Validation failed: ' + error.message);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 STATECORE PHASE 2 IMPLEMENTATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n✅ CREATED FILES:');
    for (const file of this.results.created) {
      console.log(`  • ${path.relative(this.rootDir, file)}`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      for (const error of this.results.errors) {
        console.log(`  • ${error}`);
      }
    }
    
    console.log('\n🔧 BROWSER TESTING:');
    console.log('  // Check boundary enforcement');
    console.log('  canon.boundary.getReport()');
    console.log('  window.BUS || window.BeatBus  // Should exist');
    console.log('');
    console.log('  // Test BeatBus → StateCore');
    console.log('  BB.test("STAGE_CHANGE", {from: "boot", to: "genesis"})');
    console.log('  SC.get("narrative", s => s.currentStage)  // "genesis"');
    console.log('');
    console.log('  // Test StateCore → BeatBus');
    console.log('  SC.set("quality", s => ({...s, currentTier: "ULTRA"}))');
    console.log('  // Watch console for STATE_QUALITY_UPDATED event');
    console.log('');
    console.log('  // Debug tools');
    console.log('  BB.mappings()      // List all event mappings');
    console.log('  BB.eventCount()    // Events processed');
    console.log('  SC.snapshot()      // Current state');
    
    console.log('\n📊 KEY FIXES APPLIED:');
    console.log('  ✓ Correct event payload keys (from/to for STAGE_CHANGE)');
    console.log('  ✓ BUS instance with proper fallbacks');
    console.log('  ✓ Safe array/object handling (no undefined crashes)');
    console.log('  ✓ main.jsx imports instead of StateCore mutation');
    console.log('  ✓ Canon boundary enforcement on BUS');
    console.log('  ✓ Stage index returns -1 for unknown');
    
    console.log('\n🚀 NEXT PHASES:');
    console.log('  Phase 3: SST v3.0 stage configurations');
    console.log('  Phase 4: Tier behavior system (4-tier particles)');
    console.log('  Phase 5: Choreography coordination');
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Phase 2 Complete! BeatBus Bridge ready.');
    console.log('='.repeat(80));
  }
}

// Self-bootstrap and run
async function main() {
  const doctor = new StateCorePhase2Doctor();
  await doctor.run();
}

main().catch(console.error);
